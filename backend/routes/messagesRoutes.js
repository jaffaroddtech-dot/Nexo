const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, getConversations, markAsSeen} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/:otherUserId", protect, getMessages);
router.put("/seen/:otherUserId", protect, markAsSeen);

module.exports = router;