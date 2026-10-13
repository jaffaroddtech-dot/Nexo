const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, getConversations, markAsSeen, deleteForMe, deleteForEveryone, reactToMessage} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/mediaMiddleware");    

router.post("/send", protect, upload.single("media"), sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/:otherUserId", protect, getMessages);
router.put("/seen/:otherUserId", protect, markAsSeen);
router.delete("/delete-for-me/:messageId", protect, deleteForMe);
router.delete("/delete-for-everyone/:messageId", protect, deleteForEveryone);
router.patch("/react/:messageId",protect,reactToMessage)

module.exports = router;