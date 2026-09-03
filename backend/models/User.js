const mongoose = require("mongoose");
const secretKey = process.env.PHONE_SECRET_KEY;
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    online: { type: Boolean, default: false },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contact" }],
    bio: { type: String, default: "Hey there! I'm using Nexo" },
    country: { type: String, default: "" },
    profilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.getMaskedPhoneNumber = function () {
  const original = this.phoneNumber;
  return original.replace(/.(?=.{4})/g, "*");
};

// Compare entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};



module.exports = mongoose.model("User", userSchema);
