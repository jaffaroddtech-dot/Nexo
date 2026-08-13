const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const contactRoutes = require("./contactRoutes");

module.exports = {
  "/api/users": userRoutes,
  "/api/auth": authRoutes,
  "/api/contacts": contactRoutes
};
