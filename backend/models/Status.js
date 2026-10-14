const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["image", "video", "text"], required: true },
        mediaUrl: String,
        mediaPublicId: String,
        text: { type: String, maxlength: 250 },
        backgroundColor: String,
        font: { type: String, enum: ["a", "b"], default: "a" },
        viewers: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                viewedAt: { type: Date, default: Date.now },
            },
        ],
        likes: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                likedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    },
    { timestamps: true }
);

statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", statusSchema);