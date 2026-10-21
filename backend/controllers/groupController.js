const mongoose = require("mongoose");
const Chat = require("../models/ChatSchema");
const Message = require("../models/Messages");
const User = require("../models/User");
const Contact = require("../models/Contact");
const cloudinary = require("../config/cloudinary");
const {
    joinRoom,
    leaveRoom,
    emitToUser,
    emitToRoom,
    createNotification,
} = require("../Socket/socket");

const MAX_MEMBERS = 256;

/* ===================== HELPERS ===================== */

const populateChat = (query) =>
    query
        .populate("participants", "name profilePic phoneNumber")
        .populate("groupAdmin", "name profilePic phoneNumber")
        .populate({
            path: "lastMessage",
            select: "text caption media senderId createdAt isDeleted",
        });

const cleanIds = (arr) =>
    [...new Set((Array.isArray(arr) ? arr : []).map(String))].filter((id) =>
        mongoose.isValidObjectId(id)
    );

const getKind = (mime = "") =>
    mime.startsWith("image/") ? "image"
        : mime.startsWith("video/") ? "video"
            : mime.startsWith("audio/") ? "audio"
                : "file";

const getGroupAsAdmin = async (chatId, userId) => {
    if (!mongoose.isValidObjectId(chatId)) return { error: "Invalid group", code: 400 };
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) return { error: "Group not found", code: 404 };
    if (String(chat.groupAdmin) !== String(userId))
        return { error: "Only admin can do this", code: 403 };
    return { chat };
};

// ---------- saved names ----------

// { ownerId -> Map(contactUserId -> savedName) }
const buildSavedMaps = async (ownerIds, targetIds) => {
    const byOwner = new Map();
    if (!ownerIds.length || !targetIds.length) return byOwner;

    const contacts = await Contact.find({
        owner: { $in: ownerIds },
        contactUser: { $in: targetIds },
    })
        .select("owner contactUser savedName")
        .lean();

    contacts.forEach((c) => {
        const o = String(c.owner);
        if (!byOwner.has(o)) byOwner.set(o, new Map());
        byOwner.get(o).set(String(c.contactUser), c.savedName);
    });
    return byOwner;
};

// saved name -> nahi to phone number -> nahi to asli naam
const displayName = (user, saved) =>
    (user && (saved?.get(String(user._id)) || user.phoneNumber || user.name)) ||
    "Unknown";

// group ke members ke naam dekhne wale ke hisaab se
const personalizeGroup = (group, viewerId, saved) => {
    const g = group.toObject ? group.toObject() : group;
    const fix = (u) => {
        if (!u || !u._id) return u;
        const isMe = String(u._id) === String(viewerId);
        return { ...u, realName: u.name, name: isMe ? u.name : displayName(u, saved) };
    };
    return {
        ...g,
        participants: (g.participants || []).map(fix),
        groupAdmin: fix(g.groupAdmin),
    };
};

const groupForViewer = async (chatId, viewerId) => {
    const chat = await populateChat(Chat.findById(chatId)).lean();
    if (!chat) return null;
    const memberIds = chat.participants.map((p) => String(p._id));
    const maps = await buildSavedMaps([String(viewerId)], memberIds);
    return personalizeGroup(chat, viewerId, maps.get(String(viewerId)));
};

// group ko members ko (ya sirf onlyIds ko) un ke apne saved names ke saath bhejo
const pushGroup = async (chatId, event, onlyIds) => {
    try {
        const chat = await populateChat(Chat.findById(chatId)).lean();
        if (!chat) return;
        const memberIds = chat.participants.map((p) => String(p._id));
        const targets = (onlyIds || memberIds).map(String);
        const maps = await buildSavedMaps(targets, memberIds);
        targets.forEach((uid) =>
            emitToUser(uid, event, personalizeGroup(chat, uid, maps.get(uid)))
        );
    } catch (err) {
        console.log("❌ pushGroup error:", err.message);
    }
};

// ---------- system messages ("abc added xyz") ----------

const makeSystemMessage = (chatId, action, actorId, targetId = null) =>
    Message.create({
        senderId: actorId,
        chatId,
        isSystem: true,
        system: { action, actorId, targetId },
    });

const buildMsgContext = async (messages, viewerIds) => {
    const ids = new Set();
    messages.forEach((m) => {
        if (!m.isSystem) return;
        if (m.system?.actorId) ids.add(String(m.system.actorId));
        if (m.system?.targetId) ids.add(String(m.system.targetId));
    });
    const idArr = [...ids];

    const [users, savedByOwner] = await Promise.all([
        idArr.length
            ? User.find({ _id: { $in: idArr } }).select("name phoneNumber").lean()
            : [],
        buildSavedMaps(viewerIds.map(String), idArr),
    ]);

    return { usersMap: new Map(users.map((u) => [String(u._id), u])), savedByOwner };
};

const systemText = (sys, viewerId, ctx) => {
    const v = String(viewerId);
    const saved = ctx.savedByOwner.get(v);
    const nameOf = (id) => (id ? displayName(ctx.usersMap.get(String(id)), saved) : "");

    const actor = String(sys.actorId) === v ? "You" : nameOf(sys.actorId);
    const target =
        sys.targetId && String(sys.targetId) === v ? "you" : nameOf(sys.targetId);

    switch (sys.action) {
        case "add": return `${actor} added ${target}`;
        case "remove": return `${actor} removed ${target}`;
        case "leave": return `${actor} left`;
        case "avatar": return `${actor} changed this group's icon`;
        default: return "";
    }
};

const toViewerMessage = (m, viewerId, ctx) => {
    const obj = m.toObject ? m.toObject() : m;
    if (obj.isSystem) obj.systemText = systemText(obj.system, viewerId, ctx);
    return obj;
};

const emitSystemMessages = async (msgs, recipientIds) => {
    try {
        const rids = [...new Set(recipientIds.map(String))];
        const ctx = await buildMsgContext(msgs, rids);
        rids.forEach((rid) =>
            msgs.forEach((m) =>
                emitToUser(rid, "groupSystemMessage", toViewerMessage(m, rid, ctx))
            )
        );
    } catch (err) {
        console.log("❌ emitSystemMessages error:", err.message);
    }
};

const viewerSystemMessages = async (msgs, viewerId) => {
    const ctx = await buildMsgContext(msgs, [String(viewerId)]);
    return msgs.map((m) => toViewerMessage(m, viewerId, ctx));
};

/* ===================== GROUP CRUD ===================== */

exports.createGroup = async (req, res) => {
    try {
        const { chatName, participants } = req.body;
        const me = String(req.user._id);

        if (!chatName?.trim())
            return res.status(400).json({ status: false, message: "Group name required" });

        const ids = cleanIds([me, ...(Array.isArray(participants) ? participants : [])]);
        if (ids.length < 2)
            return res.status(400).json({ status: false, message: "Add at least 1 member" });
        if (ids.length > MAX_MEMBERS)
            return res.status(400).json({ status: false, message: "Too many members" });

        const found = await User.countDocuments({ _id: { $in: ids } });
        if (found !== ids.length)
            return res.status(400).json({ status: false, message: "Some users do not exist" });

        const group = await Chat.create({
            chatName: chatName.trim(),
            isGroupChat: true,
            participants: ids,
            groupAdmin: req.user._id,
        });

        ids.forEach((uid) => joinRoom(uid, group._id));

        const others = ids.filter((uid) => uid !== me);
        pushGroup(group._id, "addedToGroup", others);
        others.forEach((uid) =>
            createNotification({
                recipient: uid,
                sender: req.user._id,
                type: "group_add",
                text: `${req.user.name} added you to "${group.chatName}"`,
                referenceId: group._id,
            })
        );

        res.status(201).json({ status: true, group: await groupForViewer(group._id, me) });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getUserChats = async (req, res) => {
    try {
        const me = req.user._id;

        const groups = await populateChat(
            Chat.find({ participants: me, isGroupChat: true }).sort({ updatedAt: -1 })
        ).lean();

        const memberIds = [
            ...new Set(groups.flatMap((g) => g.participants.map((p) => String(p._id)))),
        ];
        const maps = await buildSavedMaps([String(me)], memberIds);
        const saved = maps.get(String(me));

        const withUnread = await Promise.all(
            groups.map(async (g) => ({
                ...personalizeGroup(g, me, saved),
                unreadCount: await Message.countDocuments({
                    chatId: g._id,
                    isSystem: { $ne: true },
                    senderId: { $ne: me },
                    readBy: { $ne: me },
                    deletedFor: { $ne: me },
                }),
            }))
        );

        res.json({ status: true, groups: withUnread });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { chat, error, code } = await getGroupAsAdmin(req.params.chatId, req.user._id);
        if (error) return res.status(code).json({ status: false, message: error });

        const { chatName } = req.body;
        if (!chatName?.trim())
            return res.status(400).json({ status: false, message: "Group name required" });

        chat.chatName = chatName.trim();
        await chat.save();

        await pushGroup(chat._id, "groupUpdated");

        res.json({ status: true, group: await groupForViewer(chat._id, req.user._id) });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// ---------- GROUP PFP ----------
exports.updateGroupAvatar = async (req, res) => {
    try {
        const { chat, error, code } = await getGroupAsAdmin(req.params.chatId, req.user._id);
        if (error) {
            // multer pehle hi upload kar chuka hota hai -> wapas delete
            if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename).catch(() => { });
            return res.status(code).json({ status: false, message: error });
        }

        if (!req.file)
            return res.status(400).json({ status: false, message: "Image required" });

        // purani pfp cloudinary se hatao
        if (chat.groupAvatarPublicId) {
            await cloudinary.uploader.destroy(chat.groupAvatarPublicId).catch(() => { });
        }

        chat.groupAvatar = req.file.path;
        chat.groupAvatarPublicId = req.file.filename;
        await chat.save();

        const sysMsg = await makeSystemMessage(chat._id, "avatar", req.user._id);
        const memberIds = chat.participants.map(String);

        await pushGroup(chat._id, "groupUpdated");
        // actor ko bhi bhejo (realtime ke liye)
        await emitSystemMessages([sysMsg], memberIds);

        res.json({
            status: true,
            group: await groupForViewer(chat._id, req.user._id),
            systemMessages: await viewerSystemMessages([sysMsg], req.user._id),
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.addMembers = async (req, res) => {
    try {
        const { chat, error, code } = await getGroupAsAdmin(req.params.chatId, req.user._id);
        if (error) return res.status(code).json({ status: false, message: error });

        let sysMsgs = [];
        const existingIds = chat.participants.map(String);
        const existing = new Set(existingIds);
        const fresh = cleanIds(req.body.userIds).filter((id) => !existing.has(id));
        if (existing.size + fresh.length > MAX_MEMBERS)
            return res.status(400).json({ status: false, message: "Group is full" });

        if (fresh.length) {
            const found = await User.countDocuments({ _id: { $in: fresh } });
            if (found !== fresh.length)
                return res.status(400).json({ status: false, message: "Some users do not exist" });

            await Chat.updateOne(
                { _id: chat._id },
                { $addToSet: { participants: { $each: fresh } } }
            );

            fresh.forEach((uid) => joinRoom(uid, chat._id));

            sysMsgs = await Promise.all(
                fresh.map((uid) => makeSystemMessage(chat._id, "add", req.user._id, uid))
            );

            await pushGroup(chat._id, "addedToGroup", fresh);
            await pushGroup(chat._id, "groupUpdated", existingIds);
            // actor ko bhi bhejo (realtime ke liye)
            await emitSystemMessages(sysMsgs, [...existingIds, ...fresh]);

            fresh.forEach((uid) =>
                createNotification({
                    recipient: uid,
                    sender: req.user._id,
                    type: "group_add",
                    text: `${req.user.name} added you to "${chat.chatName}"`,
                    referenceId: chat._id,
                })
            );
        }

        res.json({
            status: true,
            group: await groupForViewer(chat._id, req.user._id),
            systemMessages: sysMsgs.length ? await viewerSystemMessages(sysMsgs, req.user._id) : [],
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { chat, error, code } = await getGroupAsAdmin(req.params.chatId, req.user._id);
        if (error) return res.status(code).json({ status: false, message: error });

        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId))
            return res.status(400).json({ status: false, message: "Invalid user" });

        if (String(userId) === String(chat.groupAdmin))
            return res
                .status(400)
                .json({ status: false, message: "Admin cannot be removed. Use leave group." });

        if (!chat.participants.some((p) => String(p) === String(userId)))
            return res.status(404).json({ status: false, message: "User is not in this group" });

        await Chat.updateOne({ _id: chat._id }, { $pull: { participants: userId } });

        leaveRoom(userId, chat._id);
        emitToUser(userId, "removedFromGroup", { chatId: String(chat._id) });

        const sysMsg = await makeSystemMessage(chat._id, "remove", req.user._id, userId);
        const remaining = chat.participants
            .map(String)
            .filter((id) => id !== String(userId));

        await pushGroup(chat._id, "groupUpdated");
        // actor ko bhi bhejo (realtime ke liye)
        await emitSystemMessages([sysMsg], remaining);

        res.json({
            status: true,
            group: await groupForViewer(chat._id, req.user._id),
            systemMessages: await viewerSystemMessages([sysMsg], req.user._id),
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!mongoose.isValidObjectId(chatId))
            return res.status(400).json({ status: false, message: "Invalid group" });

        const chat = await Chat.findOne({
            _id: chatId,
            isGroupChat: true,
            participants: req.user._id,
        });
        if (!chat)
            return res.status(404).json({ status: false, message: "Group not found" });

        chat.participants = chat.participants.filter(
            (p) => String(p) !== String(req.user._id)
        );

        if (chat.participants.length === 0) {
            await Message.deleteMany({ chatId });
            await chat.deleteOne();
            leaveRoom(req.user._id, chatId);
            return res.json({ status: true });
        }

        if (String(chat.groupAdmin) === String(req.user._id)) {
            chat.groupAdmin = chat.participants[0];
        }
        await chat.save();

        leaveRoom(req.user._id, chatId);

        const sysMsg = await makeSystemMessage(chatId, "leave", req.user._id);
        await pushGroup(chatId, "groupUpdated");
        // leave karne wale ko ye message nahi dikhana, sirf baaki members ko
        await emitSystemMessages([sysMsg], chat.participants.map(String));

        res.json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

/* ===================== GROUP MESSAGES ===================== */

exports.getGroupMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findOne({
            _id: chatId,
            isGroupChat: true,
            participants: req.user._id,
        });
        if (!chat)
            return res.status(403).json({ status: false, message: "Not a group member" });

        const raw = await Message.find({
            chatId,
            deletedFor: { $ne: req.user._id },
        })
            .populate("replyTo")
            .sort({ createdAt: 1 });

        const ctx = await buildMsgContext(raw, [req.user._id]);
        const messages = raw.map((m) => toViewerMessage(m, req.user._id, ctx));

        res.json({ status: true, messages });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.sendGroupMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text, replyTo, caption, duration } = req.body;

        const chat = await Chat.findOne({
            _id: chatId,
            isGroupChat: true,
            participants: req.user._id,
        });
        if (!chat)
            return res.status(403).json({ status: false, message: "Not a group member" });

        if (!req.file && !text?.trim())
            return res.status(400).json({ status: false, message: "Message is empty" });

        const media = req.file
            ? {
                url: req.file.path,
                publicId: req.file.filename,
                type: getKind(req.file.mimetype),
                name: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                duration: duration ? Number(duration) : undefined,
            }
            : undefined;

        const message = await Message.create({
            senderId: req.user._id,
            chatId,
            text: media ? undefined : text.trim(),
            caption: media ? caption || "" : "",
            media,
            replyTo: replyTo && replyTo !== "null" && replyTo !== "undefined" ? replyTo : null,
            readBy: [req.user._id],
        });

        chat.lastMessage = message._id;
        await chat.save();

        const populated = await Message.findById(message._id).populate("replyTo");

        // room emit (sab ko same payload, naam group.participants se resolve hote hain)
        emitToRoom(chatId, "newGroupMessage", populated);

        res.status(201).json({ status: true, message: populated });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};