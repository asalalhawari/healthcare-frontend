const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const { body, validationResult } = require("express-validator")
const Database = require("../data/database")
const router = express.Router()

// Generate unique visit ID
const generateVisitId = () => {
  return "V" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
}

// Create new visit (Patient books appointment)
router.post(
  "/",
  auth,
  authorize("patient"),
  [
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("appointmentDate").isISO8601().withMessage("Valid appointment date is required"),
    body("symptoms").trim().isLength({ min: 10 }).withMessage("Symptoms description must be at least 10 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { doctorId, appointmentDate, symptoms } = req.body

      const doctor = Database.findUserById(doctorId)
      if (!doctor || doctor.userType !== "doctor") {
        return res.status(404).json({ message: "Doctor not found" })
      }

      if (!doctor.isAvailable) {
        return res.status(400).json({ message: "Doctor is not available" })
      }

      const visits = Database.getVisits()
      const existingVisit = visits.find(
        (visit) =>
          visit.doctor === doctorId &&
          new Date(visit.appointmentDate).getTime() === new Date(appointmentDate).getTime() &&
          (visit.status === "scheduled" || visit.status === "in-progress"),
      )

      if (existingVisit) {
        return res.status(400).json({
          message: "Doctor already has a visit scheduled at this time",
        })
      }

      const visit = {
        id: generateVisitId(),
        visitId: generateVisitId(),
        patient: req.user.id,
        doctor: doctorId,
        appointmentDate: new Date(appointmentDate).toISOString(),
        symptoms,
        status: "scheduled",
        treatments: [],
        totalAmount: 0,
        isPaid: false,
        createdAt: new Date().toISOString(),
      }

      Database.addVisit(visit)

      const patient = Database.findUserById(visit.patient)
      const doctorInfo = Database.findUserById(visit.doctor)

      const populatedVisit = {
        ...visit,
        patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
        doctor: { fullName: doctorInfo.fullName, specialization: doctorInfo.specialization },
      }

      res.status(201).json(populatedVisit)
    } catch (error) {
      console.error("Error creating visit:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get visits based on user type
router.get("/", auth, async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query

    let visits = Database.getVisits()

    // Filter based on user type
    if (req.user.userType === "patient") {
      visits = visits.filter((visit) => visit.patient === req.user.id)
    } else if (req.user.userType === "doctor") {
      visits = visits.filter((visit) => visit.doctor === req.user.id)
    }
    // Finance can see all visits (no additional filter)

    // Add status filter
    if (status) {
      visits = visits.filter((visit) => visit.status === status)
    }

    // Add date range filter
    if (startDate || endDate) {
      visits = visits.filter((visit) => {
        const visitDate = new Date(visit.appointmentDate)
        if (startDate && visitDate < new Date(startDate)) return false
        if (endDate && visitDate > new Date(endDate)) return false
        return true
      })
    }

    const populatedVisits = visits.map((visit) => {
      const patient = Database.findUserById(visit.patient)
      const doctor = Database.findUserById(visit.doctor)
      return {
        ...visit,
        patient: patient ? { fullName: patient.fullName, email: patient.email, phone: patient.phone } : null,
        doctor: doctor ? { fullName: doctor.fullName, specialization: doctor.specialization } : null,
      }
    })

    // Apply search filter for finance users
    if (search && req.user.userType === "finance") {
      const searchRegex = new RegExp(search, "i")
      const filteredVisits = populatedVisits.filter(
        (visit) =>
          visit.visitId.match(searchRegex) ||
          (visit.patient && visit.patient.fullName.match(searchRegex)) ||
          (visit.doctor && visit.doctor.fullName.match(searchRegex)),
      )
      return res.json(filteredVisits.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)))
    }

    res.json(populatedVisits.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)))
  } catch (error) {
    console.error("Error fetching visits:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get specific visit
router.get("/:id", auth, async (req, res) => {
  try {
    const visit = Database.findVisitById(req.params.id)

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" })
    }

    // Check authorization
    if (req.user.userType === "patient" && visit.patient !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (req.user.userType === "doctor" && visit.doctor !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    const patient = Database.findUserById(visit.patient)
    const doctor = Database.findUserById(visit.doctor)

    const populatedVisit = {
      ...visit,
      patient: {
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
      },
      doctor: { fullName: doctor.fullName, specialization: doctor.specialization },
    }

    res.json(populatedVisit)
  } catch (error) {
    console.error("Error fetching visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Start visit (Doctor only)
router.put("/:id/start", auth, authorize("doctor"), async (req, res) => {
  try {
    const visit = Database.findVisitById(req.params.id)

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" })
    }

    if (visit.doctor !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (visit.status !== "scheduled") {
      return res.status(400).json({
        message: "Visit cannot be started. Current status: " + visit.status,
      })
    }

    visit.status = "in-progress"
    Database.updateVisit(visit.id, visit)

    const patient = Database.findUserById(visit.patient)
    const doctor = Database.findUserById(visit.doctor)

    const populatedVisit = {
      ...visit,
      patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.fullName, specialization: doctor.specialization },
    }

    res.json(populatedVisit)
  } catch (error) {
    console.error("Error starting visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update visit with medical information (Doctor only)
router.put("/:id/medical", auth, authorize("doctor"), async (req, res) => {
  try {
    const { diagnosis, treatments, notes } = req.body

    const visit = Database.findVisitById(req.params.id)

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" })
    }

    if (visit.doctor !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Update medical information
    if (diagnosis) visit.diagnosis = diagnosis
    if (treatments) visit.treatments = treatments
    if (notes) visit.notes = notes

    Database.updateVisit(visit.id, visit)

    const patient = Database.findUserById(visit.patient)
    const doctor = Database.findUserById(visit.doctor)

    const populatedVisit = {
      ...visit,
      patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.fullName, specialization: doctor.specialization },
    }

    res.json(populatedVisit)
  } catch (error) {
    console.error("Error updating visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Complete visit (Doctor only)
router.put("/:id/complete", auth, authorize("doctor"), async (req, res) => {
  try {
    const visit = Database.findVisitById(req.params.id)

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" })
    }

    if (visit.doctor !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (visit.status !== "in-progress") {
      return res.status(400).json({
        message: "Visit cannot be completed. Current status: " + visit.status,
      })
    }

    visit.status = "completed"
    Database.updateVisit(visit.id, visit)

    const patient = Database.findUserById(visit.patient)
    const doctor = Database.findUserById(visit.doctor)

    const populatedVisit = {
      ...visit,
      patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.fullName, specialization: doctor.specialization },
    }

    res.json(populatedVisit)
  } catch (error) {
    console.error("Error completing visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update payment status (Finance only)
router.put("/:id/payment", auth, authorize("finance"), async (req, res) => {
  try {
    const { isPaid } = req.body

    const visit = Database.findVisitById(req.params.id)
    if (!visit) {
      return res.status(404).json({ message: "Visit not found" })
    }

    visit.isPaid = isPaid
    Database.updateVisit(visit.id, visit)

    const patient = Database.findUserById(visit.patient)
    const doctor = Database.findUserById(visit.doctor)

    const populatedVisit = {
      ...visit,
      patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.fullName, specialization: doctor.specialization },
    }

    res.json(populatedVisit)
  } catch (error) {
    console.error("Error updating payment:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
