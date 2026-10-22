const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { deleteChat, deleteGroup } = require("../controllers/chatDeleteController");

router.delete("/user/:userId", protect, deleteChat);
router.delete("/group/:chatId", protect, deleteGroup);

module.exports = router;