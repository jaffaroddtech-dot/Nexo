const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const onlineUsers = new Map(); // userId -> socketId
let io;

const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔐 Auth middleware — JWT verify (same access token jo REST me use hota hai)
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


    socket.on("messagesSeen", ({ receiverId }) => {
      // receiverId = jiska message maine dekha (matlab wo sender tha)
      const senderSocketId = onlineUsers.get(receiverId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeenUpdate", { seenBy: socket.userId });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.userId);
      onlineUsers.delete(socket.userId);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

const getReceiverSocketId = (receiverId) => onlineUsers.get(receiverId?.toString());
const getIO = () => io;

module.exports = { initSocket, getReceiverSocketId, getIO };