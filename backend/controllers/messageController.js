const Message = require("../models/Messages");
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
            $or: [{ senderId: myId }, { receiverId: myId }],
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
        // Har contact ka sirf latest message rakho
        const conversationsMap = new Map();

        messages.forEach((msg) => {
            const otherUser =
                msg.senderId._id.toString() === myId.toString() ? msg.receiverId : msg.senderId;

            if (!conversationsMap.has(otherUser._id.toString())) {
                conversationsMap.set(otherUser._id.toString(), {
                    user: otherUser,
                    lastMessage: msg.text,
                    lastMessageTime: msg.createdAt,
                });
            }
        });


        return res.status(200).json({
            status: true,
            conversations: Array.from(conversationsMap.values()),
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Server error" });
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