const express = require("express");
const router = express.Router();
const pool = require("../data/db");
const bcrypt = require("bcryptjs");

router.post("/add-doctor", async (req, res) => {
  const { name, specialty, password } = req.body;
  if (!name || !specialty) {
    return res.status(400).json({ error: "Name and specialty are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password || "defaultPassword123", 10);

    // 1. Add to users table
    const userResult = await pool.query(
      `INSERT INTO users (username, name, email, password, role, specialty)
       VALUES ($1, $2, $3, $4, 'doctor', $5)
       RETURNING id, name, specialty`,
      [
        name.toLowerCase().replace(/\s+/g, "."), // username تلقائي
        name,
        `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`, // email dummy
        hashedPassword,
        specialty,
      ]
    );

    const doctor = userResult.rows[0];

    // 2. Optional: add to doctors table
    await pool.query(
      `INSERT INTO doctors (id, name, specialty) VALUES ($1, $2, $3)`,
      [doctor.id, doctor.name, doctor.specialty]
    );

    res.status(201).json({
      message: "Doctor added successfully!",
      doctor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding doctor" });
  }
});

module.exports = router;
