const express = require("express");
const router = express.Router();
const { createStatus, getStatuses, markStatusAsSeen, deleteStatus, likeStatus } = require("../controllers/statusController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/mediaMiddleware");

router.post("/create", protect, upload.statusSingle("file"), createStatus);
router.get("/", protect, getStatuses);
router.post("/:id/view", protect, markStatusAsSeen);
router.delete("/:id", protect, deleteStatus);
router.post("/:id/like", protect, likeStatus);

module.exports = router;