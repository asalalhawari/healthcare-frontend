const express = require("express");
const { auth } = require("../middleware/auth");
const pool = require("../data/db.js");
const router = express.Router();

// Get doctor or finance statistics
router.get("/stats", auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === "doctor") {
      // Stats for the logged-in doctor
      const visitsResult = await pool.query(
        "SELECT status, total_amount FROM visits WHERE doctor_id = $1",
        [req.user.id]
      );
      const doctorVisits = visitsResult.rows;

      const totalVisits = doctorVisits.length;
      const completedVisits = doctorVisits.filter(v => v.status === "completed").length;
      const scheduledVisits = doctorVisits.filter(v => v.status === "scheduled").length;
      const inProgressVisits = doctorVisits.filter(v => v.status === "in-progress").length;

      const totalRevenue = doctorVisits
        .filter(v => v.status === "completed")
        .reduce((sum, v) => sum + Number(v.total_amount || 0), 0);

      stats = { totalVisits, completedVisits, scheduledVisits, inProgressVisits, totalRevenue };

    } else if (req.user.role === "finance") {
      // Overall system stats for finance users
      const usersResult = await pool.query("SELECT role FROM users");
      const visitsResult = await pool.query("SELECT status, total_amount, is_paid FROM visits");

      const users = usersResult.rows;
      const visits = visitsResult.rows;

      const totalDoctors = users.filter(u => u.role === "doctor").length;
      const totalPatients = users.filter(u => u.role === "patient").length;
      const totalVisits = visits.length;
      const completedVisits = visits.filter(v => v.status === "completed").length;

      const totalRevenue = visits
        .filter(v => v.status === "completed")
        .reduce((sum, v) => sum + Number(v.total_amount || 0), 0);

      const paidAmount = visits
        .filter(v => v.status === "completed" && v.is_paid === true)
        .reduce((sum, v) => sum + Number(v.total_amount || 0), 0);

      stats = {
        totalDoctors,
        totalPatients,
        totalVisits,
        completedVisits,
        totalRevenue,
        paidAmount,
        pendingAmount: totalRevenue - paidAmount
      };
    } else {
      return res.status(403).json({ message: "Unauthorized role for stats" });
    }

    res.json(stats);

  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
