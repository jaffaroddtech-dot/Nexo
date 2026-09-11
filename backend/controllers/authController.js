const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const CryptoJS = require("crypto-js");
const nodemailer = require("nodemailer");
const userName = process.env.EMAIL_USER;
const userPass = process.env.EMAIL_PASS;

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
    const { name, email, phoneNumber, password, country, bio, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
        status: false,
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists",
        status: false,
      });
    }

    // Check if phone exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({
        message: "An account with this phone number already exists",
        status: false,
      });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, purpose: "signup" });

    if (!otpRecord) {
      return res.status(400).json({
        status: false,
        message: "OTP expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
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

    // OTP use ho gayi
    await Otp.deleteOne({ _id: otpRecord._id });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userData = newUser.toObject();
    delete userData.password;

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
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, } = req.body;
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({
        status: false,
        message: "OTP expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email, }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    user.password = newPassword;

    await user.save();

    // OTP use ho gayi
    await Otp.deleteOne({ _id: otpRecord._id, });

    return res.json({
      status: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};


// --- SEND OTP ---
exports.sendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  try {
   
    if (purpose === "resetPassword") {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
    }

    if (purpose === "signup") {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "Email already registered",
        });
      }
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await Otp.deleteMany({
      email,
      purpose,
    });

    await Otp.create({
      email,
      otp,
      purpose,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: userName,
        pass: userPass,
      },
    });

    await transporter.sendMail({
      from: `"Nexo" <${userName}>`,
      to: email,
      subject: `${purpose === "signup" ? "Verify Your Nexo Account" : "Nexo Password Reset"}`,
      html: `
        <div style="
          font-family: Arial,sans-serif;
          max-width:600px;
          margin:auto;
          padding:20px;
        ">
          <h2>${purpose === "signup" ? "Account Verification" : "Password Reset"}</h2>

          <p>Your verification code is:</p>

          <h1 style="
            letter-spacing:6px;
            color:#6d28d9;
          ">
            ${otp}
          </h1>

          <p>
            This code will expire in 5 minutes.
          </p>

          <p>
            If you didn't request this, please ignore this email.
          </p>

          <hr>

          <p>
            Team Nexo
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log("Send OTP Error:", error);

    return res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};