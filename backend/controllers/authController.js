const jwt = require("jsonwebtoken");
const User = require("../models/User");


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
    const { name, phoneNumber, password, country, bio } = req.body;

    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({
        message: "An account with this phone number already exists",
        status: false,
      });
    }

    const newUser = await User.create({
      name,
      password,
      phoneNumber,
      online: false,
      country,
      bio,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // ✅ Save refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Account created successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        country: newUser.country,
        bio: newUser.bio,
      },
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
  const { phoneNumber, password } = req.body;
  console.log("Login request body:", req.body);
  try {
    // ✅ Password field explicitly select
    const user = await User.findOne({ phoneNumber }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(201).json({
        status: false,
        message: "Invalid Phone number or password",
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
      data: { id: user._id, name: user.name, phoneNumber: user.phoneNumber }
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
      data: user,
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

