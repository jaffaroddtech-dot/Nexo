const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const secretKey = process.env.PHONE_SECRET_KEY;


// Generate Access Token (short expiry)
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Generate Refresh Token (long expiry)
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// --- REGISTER USER ---
exports.register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, country, bio } = req.body;

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists",
        status: false,
      });
    }

    // Check if phone exists (only if not hashed)
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({
        message: "An account with this phone number already exists",
        status: false,
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      phoneNumber,
      online: false,
      country,
      bio,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Account created successfully",
      token: accessToken,
      status: true,
    });
  } catch (error) {
    console.error("User save failed:", error);
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      status: false,
    });
  }
};



//---LOGIN---

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request body:", req.body);
  try {

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ Save refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await User.findByIdAndUpdate(user._id, { online: true });
    res.json({
      status: true,
      token: accessToken,
      message: "Login successful",
      // data: { id: user._id, name: user.name, phoneNumber: user.phoneNumber }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error" });
  }
};

 
// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password"); // 👈 use _id
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    return res.status(200).json({
      message: "Current user fetched successfully",
      data: { ...user.toObject(), phoneNumber: user.getMaskedPhoneNumber() },
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      status: false,
    });
  }
};



// ----Logout----
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.online = false;
      await user.save();
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Logged out successfully",
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      status: false,
    });
  }
};

// --- REFRESH TOKEN ---
// @route POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ status: false, message: "No refresh token" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      status: true,
      token: newAccessToken,
      message: "Access token refreshed successfully"
    });
  } catch (err) {
    return res.status(403).json({ status: false, message: "Invalid refresh token" });
  }
};


// --- RESET PASSWORD ---
// controllers/authController.js
// exports.resetPassword = async (req, res) => {
//   try {
//     const { phoneNumber, newPassword } = req.body;
//     const user = await User.findOne({ phoneNumber });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Sirf plain password assign karo
//     user.password = newPassword;

//     // Pre-save hook khud hash karega
//     await user.save();

//     res.json({ message: "Password reset successful" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };