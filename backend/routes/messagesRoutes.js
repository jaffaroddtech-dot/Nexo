const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, getConversations, markAsSeen, deleteForMe, deleteForEveryone} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/:otherUserId", protect, getMessages);
router.put("/seen/:otherUserId", protect, markAsSeen);
router.delete("/delete-for-me/:messageId", protect, deleteForMe);
router.delete("/delete-for-everyone/:messageId", protect, deleteForEveryone);

module.exports = router;