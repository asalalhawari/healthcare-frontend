const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const Database = require("../data/database");
const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = Database.getUsers();
    const safeUsers = users.map(({ password, ...user }) => user); // Exclude password
    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all doctors (for patient booking)
router.get("/doctors", auth, async (req, res) => {
  try {
    const users = Database.getUsers();
    const doctors = users
      .filter((user) => user.role === "doctor") ;

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: error });
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = Database.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userProfile } = user; // Exclude password from response
    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName, email, phone, specialization } = req.body;
    const updateData = { fullName, email, phone };

    if (req.user.role === "doctor" && specialization) {
      updateData.specialization = specialization;
    }

    const updatedUser = Database.updateUser(req.user._id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userProfile } = updatedUser; // Exclude password from response
    res.json(userProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update doctor availability
router.put("/availability", auth, authorize("doctor"), async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const updatedDoctor = Database.updateUser(req.user._id, { isAvailable });
    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const { password, ...doctorProfile } = updatedDoctor; // Exclude password
    res.json(doctorProfile);
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
