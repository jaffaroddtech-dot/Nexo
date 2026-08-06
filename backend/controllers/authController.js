const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @route  POST /api/auth/register

exports.register = async (req, res) => {
  try {
    console.log(req.body)
    const { name, phoneNumber, password } = req.body;

    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({
        message: "An account with this phone number already exists",
        status: false,
      });
    }

    // Create new user
    const newUser = await User.create({ name, password, phoneNumber, online:false });

    return res.status(201).json({
      message: "Account created successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
      },
      token: generateToken(newUser._id),
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
  try {
    console.log(req.body);
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(201).json({
        message: "Invalid Phone number or password",
        status: false,
      });
    }

    user.online = true;
    await user.save()

    return res.status(200).json({
      message: "Logged in successfully",
      data: {
        _id: user._id,
        name: user.name,
        online: user.online
      },
      token: generateToken(user._id),
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

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Current user fetched successfully",
      data: req.user,
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
  }};
