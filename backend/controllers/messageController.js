const Message = require("../models/Messages");
const Contact = require("../models/Contact");
const { getReceiverSocketId, getIO } = require("../Socket/socket");

// --- SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { receiverId, text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ status: false, message: "Message text is required" });
        }

        const newMessage = await Message.create({ senderId, receiverId, text });

        // Realtime emit — agar receiver online hai
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json({ status: true, message: newMessage });
    } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({ status: false, message: "Server error" });
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
        }).sort({ createdAt: 1 });

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
            .populate("senderId", "name profilePic")
            .populate("receiverId", "name profilePic");

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

            if (!conversationsMap.has(otherUser._id.toString())) {
                const savedName =
                    contactsMap.get(otherUser._id.toString());

                conversationsMap.set(otherUser._id.toString(), {
                    user: {
                        ...otherUser.toObject(),
                        name: savedName || otherUser.name,
                    },
                    lastMessage: msg.isDeleted
                        ? "🚫 This message was deleted"
                        : msg.text,
                    lastMessageTime: msg.createdAt,
                });
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
        message.text = "";
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