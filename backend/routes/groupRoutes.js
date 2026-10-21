const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/mediaMiddleware");
const avatarUpload = require("../middleware/groupAvatarMiddleware");
const {
  createGroup, getUserChats, updateGroup, updateGroupAvatar, addMembers,
  removeMember, leaveGroup, getGroupMessages, sendGroupMessage,
} = require("../controllers/groupController");

router.post("/create-group", protect, createGroup);
router.get("/", protect, getUserChats);

router.put("/:chatId", protect, updateGroup);
router.put("/:chatId/avatar", protect, avatarUpload.single("avatar"), updateGroupAvatar); // field name "avatar"
router.put("/:chatId/add", protect, addMembers);
router.put("/:chatId/remove/:userId", protect, removeMember);
router.put("/:chatId/leave", protect, leaveGroup);

router.get("/:chatId/messages", protect, getGroupMessages);
router.post("/:chatId/messages", protect, upload.single("media"), sendGroupMessage);

module.exports = router;