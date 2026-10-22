const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const contactRoutes = require("./contactRoutes");
const messageRoutes = require("./messagesRoutes");
const statusRoutes = require("./statusRoutes");
const notificationRoutes = require("./notificationRoutes");
const groupRoutes = require('./groupRoutes');
const deleteRoutes =  require("./chatDeleteRoutes"); 
module.exports = {
  "/api/users": userRoutes,
  "/api/auth": authRoutes,
  "/api/contacts": contactRoutes,
  "/api/messages": messageRoutes,
  "/api/status": statusRoutes,
  "/api/notification" : notificationRoutes,
  "/api/chats": groupRoutes,
  "/api/delete" : deleteRoutes,
};
