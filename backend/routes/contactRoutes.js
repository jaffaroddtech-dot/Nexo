const express = require("express");
const router = express.Router();
const { addContact, getContacts, deleteContact } = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");

router.post("/addContacts", protect, addContact);
router.get("/getContacts", protect, getContacts);
router.delete('/deleteContact/:id', protect, deleteContact)

module.exports = router;
