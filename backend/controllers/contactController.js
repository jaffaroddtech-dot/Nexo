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
      .populate("contactUser", "name phoneNumber online profilePic bio country email");

    return res.status(201).json({ message: "Contact saved successfully", data: populatedContact, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};

// --- DELETE CONTACT ---
exports.deleteContact = async (req, res) => {
  try {
    const contactId = req.params.id;

    // Find the contact
    const contact = await Contact.findOne({
      _id: contactId,
      owner: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
        status: false
      });
    }

    // Remove contact reference from user's contacts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { contacts: contact._id }
    });

    // Delete the contact document itself
    await Contact.findByIdAndDelete(contact._id);

    return res.status(200).json({
      message: "Contact deleted successfully",
      status: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      status: false
    });
  }
};


// Get Contacts
exports.getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "contacts",
      populate: { path: "contactUser", select: "name phoneNumber online bio country profilePic email" }
    });

    return res.status(200).json({ message: "Contacts fetched successfully", data: user.contacts, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};


// ---Update Contact---
// Update Contact Saved Name
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params; // contact id
    const { savedName } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { savedName },
      { new: true }
    ).populate("contactUser", "name phoneNumber online bio country profilePic email");

    if (!contact) {
      return res.status(404).json({ message: "Contact not found", status: false });
    }

    return res.status(200).json({ message: "Contact updated successfully", data: contact, status: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!", error: error.message, status: false });
  }
};

