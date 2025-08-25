const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../data/db.js"); 
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "24h" }
  );
};
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }),
    body("password").isLength({ min: 6 }),
    body("email").isEmail(),
    body("name").trim().isLength({ min: 2 }),
    body("role").isIn(["patient", "doctor", "finance"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        username,
        password,
        email,
        name,
        role,
        specialty,
        date_of_birth,
        phone,
      } = req.body;

      // Check if username or email already exists
      const existingUserResult = await pool.query(
        "SELECT * FROM users WHERE username = $1 OR email = $2",
        [username, email]
      );

      if (existingUserResult.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User with this username or email already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert new user
      const insertQuery = `
        INSERT INTO users (username, password, role, name, email, phone, specialty, date_of_birth)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [
        username,
        hashedPassword,
        role,
        name,
        email,
        phone || null,
        specialty || null,
        date_of_birth || null,
      ];

      const result = await pool.query(insertQuery, values);
      const user = result.rows[0];

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" + error  });
    }
  }
);
// Login user
router.post(
  "/login",
  [
    body("username").trim().notEmpty(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, password } = req.body;

      const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      const user = userResult.rows[0];

      if (!user) return res.status(400).json({ message: "User not found" });

      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = generateToken(user.id);

      res.json({ message: "Login successful", token, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

module.exports = router;
