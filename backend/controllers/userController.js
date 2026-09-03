const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const newUser = await User.create({ name, email, role, password });
    return res.status(201).json({
      message: "User created successfully",
      data: newUser,
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
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

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    return res.status(200).json({
      message: "User fetched successfully",
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

// --- UPDATE USER ---
exports.updateUser = async (req, res) => {
  console.log("Update request body:", req.user._id);
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    const { name, bio, country } = req.body;

    if (name && name !== user.name) user.name = name;
    if (bio && bio !== user.bio) user.bio = bio;
    if (country && country !== user.country) user.country = country;


    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.getMaskedPhoneNumber(),
        bio: user.bio,
        country: user.country,
        profilePic: user.profilePic,
        email: user.email,
      },
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



exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (user.profilePic) {
      const publicId = user.profilePic.split("/").pop().split(".")[0]; 
      await cloudinary.uploader.destroy(`home/${publicId}`);
    }

    user.profilePic = req.file.path; // 👈 Cloudinary URL
    await user.save();

    res.json({
      status: true,
      message: "Profile picture updated successfully",
      url: req.file.path,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Upload failed", error: err.message });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      data: deletedUser,
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
