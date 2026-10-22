const Message = require("../models/Messages");
const Contact = require("../models/Contact");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { getReceiverSocketId, getIO, createNotification } = require("../Socket/socket");


exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;


        const { receiverId, text, caption, duration } = req.body;
        const replyTo =
            req.body.replyTo && req.body.replyTo !== "null" && req.body.replyTo !== "undefined"
                ? req.body.replyTo
                : null;

        if (!receiverId) {
            return res.status(400).json({
                status: false,
                message: "receiverId is required",
            });
        }

        let media;

        if (req.file) {
            const mime = req.file.mimetype || "";

            media = {
                url: req.file.path,
                publicId: req.file.filename,
                type: mime.startsWith("image")
                    ? "image"
                    : mime.startsWith("video")
                        ? "video"
                        : mime.startsWith("audio")
                            ? "audio"
                            : "file",
                name: req.file.originalname,
                size: req.file.size,
                mimeType: mime,
                duration: Number(duration) || 0,
            };
        }

        // Neither text nor media
        if ((!text || !text.trim()) && !media) {
            return res.status(400).json({
                status: false,
                message: "Message or media required",
            });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text ? text.trim() : "",
            caption: caption ? caption.trim() : "",
            media,
            replyTo,
        });

        const populatedMessage = await Message.findById(newMessage._id).populate(
            "replyTo",
            "text caption media senderId isDeleted"
        );

        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        // 🔔 notification (chat khuli ho to helper khud skip kar deta hai)
        const notifText =
            newMessage.text ||
            newMessage.caption ||
            (media?.type === "image"
                ? "📷 Photo"
                : media?.type === "video"
                    ? "🎥 Video"
                    : media?.type === "audio"
                        ? "🎤 Voice message"
                        : "📄 Document");

        await createNotification({
            recipient: receiverId,
            sender: senderId,
            type: "message",
            text: notifText,
            referenceId: newMessage._id,
        });

        return res.status(201).json({
            status: true,
            message: populatedMessage,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};



// --- GET MESSAGES (ek user ke sath poori conversation) ---
exports.getMessages = async (req, res) => {
    try {
        const myId = req.user._id;
        const { otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId },
            ],
            deletedFor: {
                $nin: [myId],
            },
        })
            .populate("replyTo", "text senderId isDeleted")
            .populate(
                "statusReply.statusId",
                "type text mediaUrl"
            )
            .sort({ createdAt: 1 });

        return res.status(200).json({ status: true, messages });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Server error" });
    }
};

// --- GET CONVERSATIONS LIST (Home.jsx ke left side ke liye) ---
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId },
                { receiverId: myId },
            ],
            chatId: null, // group messages ko 1-1 conversations se bahar rakho
            deletedFor: {
                $nin: [myId],
            },
        })
            .sort({ createdAt: -1 })
            .populate("senderId", "name profilePic online lastSeen")
            .populate("receiverId", "name profilePic online lastSeen")
            .populate("statusReply.statusId", "type text mediaUrl");
        if (!messages.length) {
            return res.status(200).json({
                status: true,
                conversations: [],
                message: "No conversations found",
            });
        }

        const contacts = await Contact.find({
            owner: myId,
        });

        const contactsMap = new Map(
            contacts.map((contact) => [
                contact.contactUser.toString(),
                contact.savedName,
            ])
        );

        const conversationsMap = new Map();

        const getLastMessagePreview = (msg) => {
            if (msg.isDeleted) {
                return {
                    text: "This message was deleted",
                    type: "text",
                };
            }

            if (msg.media?.type === "image") {
                return {
                    text: msg.caption?.trim() || "Photo",
                    type: "image",
                };
            }

            if (msg.media?.type === "video") {
                return {
                    text: msg.caption?.trim() || "Video",
                    type: "video",
                };
            }

            if (msg.media?.type === "file") {
                return {
                    text: msg.caption?.trim() || msg.media?.name || "Document",
                    type: "file",
                };
            }

            if (msg.media?.type === "audio") {
                return {
                    text: msg.caption?.trim() || "Voice Message",
                    type: "audio",
                };
            }

            return {
                text: msg.text || "",
                type: "text",
            };
        };

        messages.forEach((msg) => {
            if (!msg.senderId || !msg.receiverId) return;

            const otherUser =
                String(msg.senderId._id) === String(myId)
                    ? msg.receiverId
                    : msg.senderId;

            const otherUserId = otherUser._id.toString();

            if (!conversationsMap.has(otherUserId)) {
                const savedName = contactsMap.get(otherUserId);

                const preview = getLastMessagePreview(msg);

                conversationsMap.set(otherUserId, {
                    user: {
                        ...otherUser.toObject(),
                        name: savedName || otherUser.name,
                    },

                    lastMessage: preview.text,
                    lastMessageType: preview.type,

                    lastMessageTime: msg.createdAt,

                    unreadCount: 0,
                });
            }

            if (
                String(msg.receiverId._id) === String(myId) &&
                msg.seen === false
            ) {
                const conversation = conversationsMap.get(otherUserId);
                conversation.unreadCount += 1;
            }
        });

        return res.status(200).json({
            status: true,
            conversations: Array.from(conversationsMap.values()),
        });
    } catch (error) {
        console.error("Get Conversations Error:", error);

        return res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};

// --- MARK MESSAGES AS SEEN ---
exports.markAsSeen = async (req, res) => {
    try {
        const myId = req.user._id;
        const { otherUserId } = req.params;

        await Message.updateMany(
            { senderId: otherUserId, receiverId: myId, seen: false },
            { $set: { seen: true } }
        );

        return res.status(200).json({ status: true, message: "Messages marked as seen" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Server error" });
    }
};


// --- DELETE MESSAGE(FOR ME) ---
exports.deleteForMe = async (req, res) => {
    try {

        const userId = req.user._id;
        const { messageId } = req.params;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ status: false, message: "Message not found" });
        }

        await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: userId },
        });

        return res.status(200).json({ status: true, message: "Deleted for you" });
    } catch (error) {
        console.error("Delete for me error:", error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
};

// --- DELETE MESSAGE(FOR EVERYONE) ---
exports.deleteForEveryone = async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                status: false,
                message: "Message not found",
            });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({
                status: false,
                message: "Not allowed",
            });
        }

        // Delete media from Cloudinary
        if (message.media?.publicId) {
            await cloudinary.uploader.destroy(
                message.media.publicId,
                {
                    resource_type:
                        message.media.type === "image"
                            ? "image"
                            : message.media.type === "file"
                                ? "raw"
                                : "video",
                }
            );
        }

        message.isDeleted = true;
        message.media = null;
        message.text = "";
        message.caption = "";

        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId);

        if (receiverSocketId) {
            getIO()
                .to(receiverSocketId)
                .emit("messageDeleted", {
                    messageId: message._id,
                });
        }

        return res.status(200).json({
            status: true,
            message: "Deleted for everyone",
        });
    } catch (error) {
        console.error("Delete for everyone error:", error);

        return res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};


exports.reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                status: false,
                message: "Message not found"
            });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (reaction) => String(reaction.userId) === String(userId)
        );

        if (existingReactionIndex !== -1) {

            if (
                message.reactions[existingReactionIndex].emoji === emoji
            ) {
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                message.reactions[existingReactionIndex].emoji = emoji;
            }

        } else {
            message.reactions.push({
                userId,
                emoji,
            });
        }

        await message.save();
        const populatedMessage =
            await Message.findById(
                message._id
            ).populate(
                "replyTo",
                "text senderId isDeleted"
            );

        return res.json({
            status: true,
            message: populatedMessage,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: "server error"
        });
    }
};


exports.searchUserByPhone = async (req, res) => {
    try {
        const digits = String(req.params.phone || "").replace(/\D/g, "");
        if (digits.length < 7) {
            return res.json({ status: false, message: "Invalid number" });
        }

        // country code ka farq na pade, is liye last 10 digits match
        const tail = digits.slice(-10);
        const user = await User.findOne({
            phoneNumber: { $regex: `${tail}$` },
            _id: { $ne: req.user._id },
        }).select("name profilePic phoneNumber");
        if (!user) return res.json({ status: false, message: "Not registered" });

        res.json({ status: true, user });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message, error: console.error(err) });
    }
};