const Contact = require("../models/Contact");
const User = require("../models/User");

// Add Contact
exports.addContact = async (req, res) => {
  const {Name, phoneNumber } = req.body;
  console.log(Name,phoneNumber)
  try {
    const foundUser = await User.findOne({ phoneNumber });
    if (!foundUser) {
      return res.status(404).json({ message: "This number is not registered on NEXO", status: false });
    }

    const existingContact = await Contact.findOne({
      owner: req.user._id,
      contactUser: foundUser._id
    });
    if (existingContact) {
      return res.status(400).json({ message: "Contact already exists", status: false });
    }

    const newContact = await Contact.create({
      owner: req.user._id,
      contactUser: foundUser._id,
      savedName: Name || foundUser.name
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { contacts: newContact._id } });

    const populatedContact = await Contact.findById(newContact._id)
      .populate("contactUser", "name phoneNumber online profilePic");

    return res.status(201).json({ message: "Contact saved successfully", data: populatedContact, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};


// Get Contacts
exports.getContacts = async (req, res) => {
  console.log(req)
  try {
    const user = await User.findById(req.user._id).populate({
      path: "contacts",
      populate: { path: "contactUser", select: "name phoneNumber online bio country profilePic " }
    });

    return res.status(200).json({ message: "Contacts fetched successfully", data: user.contacts, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};
