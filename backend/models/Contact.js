const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    savedName: { type: String, required: true } // jis naam se owner ne save kiya
  },
  { timestamps: true }
);

// Prevent duplicate contacts per owner
contactSchema.index({ owner: 1, contactUser: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);
