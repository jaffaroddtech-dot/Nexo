const User = require("../models/User");

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

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
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
