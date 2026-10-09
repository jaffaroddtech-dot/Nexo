const Message = require("../models/Messages");
const Contact = require("../models/Contact");
const { getReceiverSocketId, getIO } = require("../Socket/socket");

// --- SEND MESSAGE ---
// exports.sendMessage = async (req, res) => {
//     try {
//         const senderId = req.user._id;
//         const { receiverId, text, replyTo } = req.body;

//         if (!text || !text.trim()) {
//             return res.status(400).json({ status: false, message: "Message text is required" });
//         }

//         const newMessage = await Message.create({ senderId, receiverId, text, replyTo });


//         const populatedMessage = await Message
//             .findById(newMessage._id)
//             .populate("replyTo", "text senderId isDeleted");

//         // Realtime emit — agar receiver online hai
//         const receiverSocketId = getReceiverSocketId(receiverId);
//         if (receiverSocketId) {
//             getIO().to(receiverSocketId).emit("newMessage", populatedMessage);
//         }

//         return res.status(201).json({ status: true, message: populatedMessage });
//     } catch (error) {
//         console.error("Send message error:", error);
//         return res.status(500).json({ status: false, message: "Server error" });
//     }
// };

exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;

        const {
            receiverId,
            text,
            replyTo,
            caption
        } = req.body;

        let media = null;

        if (req.file) {
            media = {
                url: req.file.path,
                publicId: req.file.filename,
                type: req.file.mimetype.startsWith("image")
                    ? "image"
                    : req.file.mimetype.startsWith("video")
                        ? "video"
                        : "file",
            };
        }

        // Na text hai na media
        if (
            (!text || !text.trim()) &&
            !media
        ) {
            return res.status(400).json({
                status: false,
                message: "Message or media required",
            });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            caption: caption || "",
            media,
            replyTo,
        });

        const populatedMessage =
            await Message.findById(
                newMessage._id
            ).populate(
                "replyTo",
                "text senderId isDeleted"
            );

        const receiverSocketId =
            getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            getIO()
                .to(receiverSocketId)
                .emit(
                    "newMessage",
                    populatedMessage
                );
        }

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
                { receiverId: myId }
            ],
            deletedFor: {
                $nin: [myId],
            },
        })
            .sort({ createdAt: -1 })
            .populate("senderId", "name profilePic online lastSeen")
            .populate("receiverId", "name profilePic online lastSeen");

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

        messages.forEach((msg) => {
            const otherUser =
                String(msg.senderId._id) === String(myId)
                    ? msg.receiverId
                    : msg.senderId;

            const otherUserId = otherUser._id.toString();

            if (!conversationsMap.has(otherUserId)) {
                const savedName =
                    contactsMap.get(otherUserId);

                conversationsMap.set(otherUserId, {
                    user: {
                        ...otherUser.toObject(),
                        name: savedName || otherUser.name,
                    },

                    lastMessage: msg.isDeleted
                        ? "🚫 This message was deleted"
                        : msg.text,

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
            conversations: Array.from(
                conversationsMap.values()
            ),
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
        console.log("Delete for me request:", { userId, messageId });
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
            return res.status(404).json({ status: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ status: false, message: "Not allowed" });
        }

        message.isDeleted = true;
        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("messageDeleted", { messageId: message._id });
        }

        return res.status(200).json({ status: true, message: "Deleted for everyone" });
    } catch (error) {
        console.error("Delete for everyone error:", error);
        return res.status(500).json({ status: false, message: "Server error" });
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

        const existingReactionIndex = message.reactions.findIndex((reaction) => String(reaction.userId) === (String(userId)));

        if (existingReactionIndex !== -1) {
            message.reactions[
                existingReactionIndex
            ].emoji = emoji;
        } else {
            message.reactions.push({
                userId,
                emoji
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