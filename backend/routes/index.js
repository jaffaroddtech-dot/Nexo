const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");

module.exports = {
  "/api/users": userRoutes,
  "/api/auth": authRoutes,
};
