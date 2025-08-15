const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("../data/database");
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
};

// Register user
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("fullName").trim().isLength({ min: 2 }).withMessage("Full name is required"),
    body("userType").isIn(["patient", "doctor", "finance"]).withMessage("Invalid user type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, email, fullName, userType, specialization, dateOfBirth, phone } = req.body;

      const existingUser = db.findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          message: "User with this username already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userData = {
        username,
        password: hashedPassword,
        email,
        name: fullName,
        role: userType,
        phone,
      };

      if (userType === "doctor") {
        userData.specialty = specialization;
      } else if (userType === "patient") {
        userData.dateOfBirth = dateOfBirth;
      }

      const user = db.addUser(userData);
      const token = generateToken(user.id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: user,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

// Login user
router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      const user = db.findUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "user not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
        

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          specialty: user.specialty,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

module.exports = router;
