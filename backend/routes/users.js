const express = require("express");
const router = express.Router();
const pool = require("../data/db.js"); // ملف db.js
const bcrypt = require("bcryptjs");

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role, name, email, phone, specialty, date_of_birth FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all doctors (for patient booking)
router.get("/doctors", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role, name, email, phone, specialty, date_of_birth FROM users");
    const doctors = result.rows
      .filter((user) => user.role === "doctor") ;

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
