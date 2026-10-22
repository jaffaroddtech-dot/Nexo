const mongoose = require("mongoose");
const Chat = require("../models/ChatSchema");
const Message = require("../models/Messages");
const Notification = require("../models/Notification");
const { deleteMediaFromCloudinary } = require("../utils/cloudinaryCleanup");
const { getIO, emitToRoom } = require("../socket/socket"); // ⚠️ apna sahi path

/* ---------- 1-1 chat: sirf mere liye delete ---------- */
exports.deleteChat = async (req, res) => {
  try {
    const me = req.user._id;
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId))
      return res.status(400).json({ status: false, message: "Invalid user" });

    const pair = {
      $or: [
        { senderId: me, receiverId: userId },
        { senderId: userId, receiverId: me },
      ],
    };

    // 1) mere liye hide (doosre user ki copy waisi hi rehti hai)
    await Message.updateMany(
      { ...pair, deletedFor: { $ne: me } },
      { $addToSet: { deletedFor: me } }
    );

    // 2) jo messages dono users ne delete kar diye, ab unhe koi nahi dekh sakta:
    //    sirf inhi ko DB aur Cloudinary se saaf karo
    const bothDeleted = { ...pair, deletedFor: { $all: [me, userId] } };
    const orphaned = await Message.find(bothDeleted).select("media");

    if (orphaned.length) {
      await deleteMediaFromCloudinary(orphaned);
      await Message.deleteMany(bothDeleted);
    }

    // mere paas jo is chat ki notifications thin
    await Notification.deleteMany({
      type: "message",
      recipient: me,
      sender: userId,
    });

    res.json({ status: true });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/* ---------- group (sirf admin, sab ke liye) ---------- */
exports.deleteGroup = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.isValidObjectId(chatId))
      return res.status(400).json({ status: false, message: "Invalid group" });

    const chat = await Chat.findOne({ _id: chatId, isGroupChat: true });
    if (!chat)
      return res.status(404).json({ status: false, message: "Group not found" });

    if (String(chat.groupAdmin) !== String(req.user._id))
      return res
        .status(403)
        .json({ status: false, message: "Only admin can delete the group" });

    const messages = await Message.find({ chatId }).select("media");

    await deleteMediaFromCloudinary(messages);
    await Message.deleteMany({ chatId });
    await Notification.deleteMany({ type: "group_add", referenceId: chatId });
    await chat.deleteOne();

    emitToRoom(chatId, "groupDeleted", { chatId: String(chatId) });
    getIO()?.in(String(chatId)).socketsLeave(String(chatId));

    res.json({ status: true, deleted: messages.length });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};