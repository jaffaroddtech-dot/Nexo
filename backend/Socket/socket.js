const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require('../models/Messages');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Chat = require('../models/ChatSchema');

const onlineUsers = new Map(); // userId -> socketId
const activeChats = new Map(); // userId -> kis user ki chat khuli hai
let io;

const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔐 Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.userId);

    onlineUsers.set(socket.userId, socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    socket.on("openChat", ({ chatWithId }) => {
      if (chatWithId) activeChats.set(socket.userId, chatWithId.toString());
    });

    socket.on("closeChat", () => {
      activeChats.delete(socket.userId);
    });

    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId: socket.userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { senderId: socket.userId });
      }
    });

    socket.on("newMessage", ({ receiverId, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", { message });
      }
    });

    socket.on("messagesSeen", async ({ receiverId }) => {
      try {
        await Message.updateMany(
          { senderId: receiverId, receiverId: socket.userId, seen: false },
          { $set: { seen: true } }
        );

        const senderSocketId = onlineUsers.get(receiverId?.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesSeenUpdate", { seenBy: socket.userId });
        }
      } catch (error) {
        console.log("❌ messagesSeen error:", error);
      }
    });

    socket.on("messageDeleted", ({ receiverId, messageId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId });
      }
    });

    socket.on("messageReaction", ({ receiverId, messageId, reactions }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReactionUpdate", { messageId, reactions });
      }
    });

    // =====================================================
    //                       GROUPS
    // =====================================================

    // user ke saare groups ke rooms join (room name = group ki _id)
    Chat.find({ participants: socket.userId, isGroupChat: true })
      .select("_id")
      .then((groups) => groups.forEach((g) => socket.join(String(g._id))))
      .catch((err) => console.log("❌ join group rooms error:", err.message));

    // sirf wahi event accept ho jiska sender us group ke room mein ho
    const inRoom = (chatId) => socket.rooms.has(String(chatId));

    socket.on("groupTyping", ({ chatId }) => {
      if (!inRoom(chatId)) return;
      socket.to(String(chatId)).emit("groupTyping", { chatId, senderId: socket.userId });
    });

    socket.on("groupStopTyping", ({ chatId }) => {
      if (!inRoom(chatId)) return;
      socket.to(String(chatId)).emit("groupStopTyping", { chatId, senderId: socket.userId });
    });

    socket.on("groupMessagesSeen", async ({ chatId }) => {
      try {
        if (!inRoom(chatId)) return;
        await Message.updateMany(
          { chatId, readBy: { $ne: socket.userId } },
          { $addToSet: { readBy: socket.userId } }
        );
        socket.to(String(chatId)).emit("groupSeenUpdate", { chatId, seenBy: socket.userId });
      } catch (error) {
        console.log("❌ groupMessagesSeen error:", error);
      }
    });

    socket.on("groupMessageDeleted", ({ chatId, messageId }) => {
      if (!inRoom(chatId)) return;
      socket.to(String(chatId)).emit("groupMessageDeleted", { chatId, messageId });
    });

    socket.on("groupMessageReaction", ({ chatId, messageId, reactions }) => {
      if (!inRoom(chatId)) return;
      socket.to(String(chatId)).emit("groupMessageReactionUpdate", { chatId, messageId, reactions });
    });

    socket.on("disconnect", async () => {
      console.log("🔴 Disconnected:", socket.userId);
      onlineUsers.delete(socket.userId);
      activeChats.delete(socket.userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(socket.userId, {
        online: false,
        lastSeen,
      });
      io.emit("userOffline", {
        userId: socket.userId,
        lastSeen,
      });
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

const getReceiverSocketId = (receiverId) => onlineUsers.get(receiverId?.toString());
const getIO = () => io;

// ---------- group helpers (controllers se use honge) ----------
const joinRoom = (userId, room) => {
  const sid = onlineUsers.get(String(userId));
  if (sid && io) io.in(sid).socketsJoin(String(room));
};

const leaveRoom = (userId, room) => {
  const sid = onlineUsers.get(String(userId));
  if (sid && io) io.in(sid).socketsLeave(String(room));
};

const emitToUser = (userId, event, payload) => {
  const sid = onlineUsers.get(String(userId));
  if (sid && io) io.to(sid).emit(event, payload);
};

const emitToRoom = (room, event, payload) => {
  if (io) io.to(String(room)).emit(event, payload);
};

const createNotification = async ({
  recipient,
  sender,
  type,
  text,
  referenceId,
}) => {
  try {
    if (!recipient || !sender) return null;

    if (recipient.toString() === sender.toString()) return null;

    if (
      type === "message" &&
      activeChats.get(recipient.toString()) === sender.toString()
    ) {
      return null;
    }

    if (type === "message") {
      await Notification.deleteMany({
        recipient,
        sender,
        type: "message",
        isRead: false,
      });
    }

    if (type === "status_like") {
      const exists = await Notification.findOne({
        recipient,
        sender,
        type,
        referenceId,
      });
      if (exists) return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      text,
      referenceId,
    });

    await notification.populate("sender", "name profilePic");

    const socketId = getReceiverSocketId(recipient);
    if (socketId && io) {
      io.to(socketId).emit("newNotification", notification);
    }

    return notification;
  } catch (error) {
    console.log("❌ createNotification error:", error.message);
    return null;
  }
};

module.exports = {
  initSocket,
  getReceiverSocketId,
  getIO,
  createNotification,
  joinRoom,
  leaveRoom,
  emitToUser,
  emitToRoom,
};