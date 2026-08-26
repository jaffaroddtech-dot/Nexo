const express = require("express");
const router = express.Router();
const { loginLimiter, registerLimiter } = require("../middleware/limiterMiddleware");
const { register, login, getMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);
router.post('/logout', protect, logout)

module.exports = router;
