const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    text: {
      type: String,
      trim: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
        },
      },
    ],
    caption: {
      type: String,
      default: "",
    },
    media: {
      url: String,
      publicId: String,
      type: { type: String, enum: ["image", "video", "audio", "file"] },
      name: String,
      size: Number,
      mimeType: String,
      duration: Number, // seconds (voice messages)
    },
    statusReply: {
      statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Status",
        default: null,
      },

      statusType: {
        type: String,
        enum: ["text", "image", "video"],
      },

      previewText: String,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    isSystem: { type: Boolean, default: false },
    system: {
      action: { type: String, enum: ["add", "remove", "leave", "avatar"] },
      actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      targetId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);