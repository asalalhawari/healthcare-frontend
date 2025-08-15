const express = require("express")
const { auth } = require("../middleware/auth")
const Database = require("../data/database")
const router = express.Router()

// Get doctor statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const db = new Database()
    const stats = {}

    if (req.user.userType === "doctor") {
      // Doctor's own stats
      const visits = db.getVisits()
      const doctorVisits = visits.filter((visit) => visit.doctor === req.user.id)

      const totalVisits = doctorVisits.length
      const completedVisits = doctorVisits.filter((visit) => visit.status === "completed").length
      const scheduledVisits = doctorVisits.filter((visit) => visit.status === "scheduled").length
      const inProgressVisits = doctorVisits.filter((visit) => visit.status === "in-progress").length

      const totalRevenue = doctorVisits
        .filter((visit) => visit.status === "completed")
        .reduce((sum, visit) => sum + (visit.totalAmount || 0), 0)

      stats.totalVisits = totalVisits
      stats.completedVisits = completedVisits
      stats.scheduledVisits = scheduledVisits
      stats.inProgressVisits = inProgressVisits
      stats.totalRevenue = totalRevenue
    } else if (req.user.userType === "finance") {
      // Overall system stats
      const users = db.getUsers()
      const visits = db.getVisits()

      const totalDoctors = users.filter((user) => user.userType === "doctor").length
      const totalPatients = users.filter((user) => user.userType === "patient").length
      const totalVisits = visits.length
      const completedVisits = visits.filter((visit) => visit.status === "completed").length

      const totalRevenue = visits
        .filter((visit) => visit.status === "completed")
        .reduce((sum, visit) => sum + (visit.totalAmount || 0), 0)

      const paidAmount = visits
        .filter((visit) => visit.status === "completed" && visit.isPaid === true)
        .reduce((sum, visit) => sum + (visit.totalAmount || 0), 0)

      stats.totalDoctors = totalDoctors
      stats.totalPatients = totalPatients
      stats.totalVisits = totalVisits
      stats.completedVisits = completedVisits
      stats.totalRevenue = totalRevenue
      stats.paidAmount = paidAmount
      stats.pendingAmount = totalRevenue - paidAmount
    }

    res.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
