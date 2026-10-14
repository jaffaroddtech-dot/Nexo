const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const contactRoutes = require("./contactRoutes");
const messageRoutes = require("./messagesRoutes");
const statusRoutes = require("./statusRoutes");

module.exports = {
  "/api/users": userRoutes,
  "/api/auth": authRoutes,
  "/api/contacts": contactRoutes,
  "/api/messages": messageRoutes,
  "/api/status": statusRoutes,
};
