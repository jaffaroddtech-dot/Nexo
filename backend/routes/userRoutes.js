const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


router.post("/", createUser);
router.get("/", protect, getAllUsers);
router.get("/:id", protect, getUserById);
router.post('/updateProfile/:id', protect, upload.single("image"), updateProfile)
router.put("/profile/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

module.exports = router;
