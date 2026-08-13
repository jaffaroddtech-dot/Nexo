const express = require("express");
const router = express.Router();
const { addContact, getContacts } = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");

router.post("/addContact", protect, addContact);
router.get("/getContacts", protect, getContacts);

module.exports = router;
