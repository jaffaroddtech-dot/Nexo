const Contact = require("../models/Contact");
const User = require("../models/User");

// Add Contact
exports.addContact = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const foundUser = await User.findOne({ phoneNumber });
    if (!foundUser) {
      return res.status(404).json({ message: "This number is not registered on NEXO", status: false });
    }

    const newContact = await Contact.create({
      owner: req.user._id,
      contactUser: foundUser._id,
      savedName: req.body.savedName || foundUser.name // Use the provided saved name or the user's name
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { contacts: newContact._id } });

    return res.status(201).json({ message: "Contact saved successfully", data: newContact, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};

// Get Contacts
exports.getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "contacts",
      populate: { path: "contactUser", select: "name phoneNumber online" }
    });

    return res.status(200).json({ message: "Contacts fetched successfully", data: user.contacts, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};
