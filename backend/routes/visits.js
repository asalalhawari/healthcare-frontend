const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const pool = require("../data/db.js");
const router = express.Router();

// Generate unique visit ID
const generateVisitId = () =>
  "V" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

// Create new visit (only patients can create)
router.post(
  "/",
  auth,
  authorize("patient"),
  [
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("date").isISO8601().withMessage("Valid appointment date is required"),
    body("symptoms").optional().isLength({ min: 3 }).withMessage("Symptoms too short"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { doctorId, date, symptoms } = req.body;

      // ✅ Check doctor exists
      const doctorResult = await pool.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'doctor'",
        [doctorId]
      );
      if (doctorResult.rows.length === 0)
        return res.status(404).json({ message: "Doctor not found" });

      // ✅ Check for existing visit at same time
      const existingVisitResult = await pool.query(
        "SELECT * FROM visits WHERE doctor_id = $1 AND appointment_date = $2 AND status IN ('scheduled','in-progress')",
        [doctorId, date]
      );
      if (existingVisitResult.rows.length > 0)
        return res.status(400).json({ message: "Doctor already has a visit scheduled at this time" });

      // ✅ Insert visit (no need for id, SERIAL will handle it)
      const insertResult = await pool.query(
        `INSERT INTO visits (patient_id, doctor_id, appointment_date, symptoms, status)
         VALUES ($1, $2, $3, $4, 'scheduled') RETURNING *`,
        [req.user.id, doctorId, date, symptoms || null]
      );

      const visit = insertResult.rows[0];
      res.status(201).json(visit);

    } catch (error) {
      console.error("Error creating visit:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Get visits for current user with patient & doctor info
router.get("/", auth, async (req, res) => {
  try {
    let query = `
      SELECT v.*, 
             p.name AS patient_name, p.email AS patient_email,
             d.name AS doctor_name, d.specialty AS doctor_specialty
      FROM visits v
      JOIN users p ON v.patient_id = p.id
      JOIN users d ON v.doctor_id = d.id
    `;
    const params = [];

    if (req.user.role === "patient") {
      query += " WHERE v.patient_id = $1";
      params.push(req.user.id);
    } else if (req.user.role === "doctor") {
      query += " WHERE v.doctor_id = $1";
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching visits:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific visit
router.get("/:id", auth, async (req, res) => {
  try {
    const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [
      req.params.id,
    ])
    const visit = visitResult.rows[0]
    if (!visit) return res.status(404).json({ message: "Visit not found" })

    // Authorization
    if (req.user.role === "patient" && visit.patient_id !== req.user.id)
      return res.status(403).json({ message: "Access denied" })
    if (req.user.role === "doctor" && visit.doctor_id !== req.user.id)
      return res.status(403).json({ message: "Access denied" })

    const patient = await getUserById(visit.patient_id)
    const doctor = await getUserById(visit.doctor_id)

    res.json({
      ...visit,
      patient: {
        fullName: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
      },
      doctor: { fullName: doctor.name, specialty: doctor.specialty },
    })
  } catch (error) {
    console.error("Error fetching visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update a visit
router.put("/:id", auth, async (req, res) => {
  try {
    const { symptoms, status, totalAmount, treatments } = req.body;

    // Fetch the visit
    const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [req.params.id]);
    const visit = visitResult.rows[0];
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    // Authorization check
    if (req.user.role === "patient" && visit.patient_id !== req.user.id)
      return res.status(403).json({ message: "Access denied" });
    if (req.user.role === "doctor" && visit.doctor_id !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    // Prepare updated fields
    const updatedSymptoms = req.user.role === "patient" ? symptoms || visit.symptoms : visit.symptoms;
    const updatedStatus = req.user.role === "doctor" ? status || visit.status : visit.status;
    const updatedTotalAmount = req.user.role === "doctor" ? totalAmount || visit.total_amount : visit.total_amount;
    const updatedTreatments = req.user.role === "doctor" ? treatments || visit.treatments : visit.treatments;

    // Update in DB
    const updateQuery = `
      UPDATE visits 
      SET symptoms = $1, status = $2, total_amount = $3, treatments = $4
      WHERE id = $5
      RETURNING *
    `;
    const updatedVisitResult = await pool.query(updateQuery, [
      updatedSymptoms,
      updatedStatus,
      updatedTotalAmount,
      JSON.stringify(updatedTreatments), // store JSON as string
      req.params.id,
    ]);

    const updatedVisit = updatedVisitResult.rows[0];

    res.json(updatedVisit);
  } catch (error) {
    console.error("Error updating visit:", error);
    res.status(500).json({ message: error.message });
  }
});


// Start visit (Doctor only)
router.put("/:id/start", auth, authorize("doctor"), async (req, res) => {
  try {
    const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [
      req.params.id,
    ])
    const visit = visitResult.rows[0]
    if (!visit) return res.status(404).json({ message: "Visit not found" })

    if (visit.doctor_id !== req.user.id) return res.status(403).json({ message: "Access denied" })
    if (visit.status !== "scheduled")
      return res.status(400).json({ message: `Visit cannot be started. Current status: ${visit.status}` })

    await pool.query("UPDATE visits SET status = 'in-progress' WHERE id = $1", [req.params.id])

    const patient = await getUserById(visit.patient_id)
    const doctor = await getUserById(visit.doctor_id)

    res.json({
      ...visit,
      status: "in-progress",
      patient: { fullName: patient.name, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.name, specialty: doctor.specialty },
    })
  } catch (error) {
    console.error("Error starting visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update medical info (Doctor only)
router.put(
  "/:id/medical",
  auth,
  authorize("doctor"),
  [
    body("diagnosis").optional().isString(),
    body("treatments").optional().isArray(),
    body("notes").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const { diagnosis, treatments, notes } = req.body
      const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [req.params.id])
      const visit = visitResult.rows[0]
      if (!visit) return res.status(404).json({ message: "Visit not found" })
      if (visit.doctor_id !== req.user.id) return res.status(403).json({ message: "Access denied" })

      await pool.query(
        `UPDATE visits SET diagnosis = $1, treatments = $2, notes = $3 WHERE id = $4`,
        [diagnosis || visit.diagnosis, treatments || visit.treatments, notes || visit.notes, req.params.id]
      )

      const patient = await getUserById(visit.patient_id)
      const doctor = await getUserById(visit.doctor_id)

      res.json({
        ...visit,
        diagnosis: diagnosis || visit.diagnosis,
        treatments: treatments || visit.treatments,
        notes: notes || visit.notes,
        patient: { fullName: patient.name, email: patient.email, phone: patient.phone },
        doctor: { fullName: doctor.name, specialty: doctor.specialty },
      })
    } catch (error) {
      console.error("Error updating visit:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Complete visit (Doctor only)
router.put("/:id/complete", auth, authorize("doctor"), async (req, res) => {
  try {
    const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [req.params.id])
    const visit = visitResult.rows[0]
    if (!visit) return res.status(404).json({ message: "Visit not found" })
    if (visit.doctor_id !== req.user.id) return res.status(403).json({ message: "Access denied" })
    if (visit.status !== "in-progress")
      return res.status(400).json({ message: `Visit cannot be completed. Current status: ${visit.status}` })

    await pool.query("UPDATE visits SET status = 'completed' WHERE id = $1", [req.params.id])

    const patient = await getUserById(visit.patient_id)
    const doctor = await getUserById(visit.doctor_id)

    res.json({
      ...visit,
      status: "completed",
      patient: { fullName: patient.name, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.name, specialty: doctor.specialty },
    })
  } catch (error) {
    console.error("Error completing visit:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update payment status (Finance only)
router.put("/:id/payment", auth, authorize("finance"), async (req, res) => {
  try {
    const { isPaid } = req.body
    const visitResult = await pool.query("SELECT * FROM visits WHERE id = $1", [req.params.id])
    const visit = visitResult.rows[0]
    if (!visit) return res.status(404).json({ message: "Visit not found" })

    await pool.query("UPDATE visits SET is_paid = $1 WHERE id = $2", [isPaid, req.params.id])

    const patient = await getUserById(visit.patient_id)
    const doctor = await getUserById(visit.doctor_id)

    res.json({
      ...visit,
      is_paid: isPaid,
      patient: { fullName: patient.name, email: patient.email, phone: patient.phone },
      doctor: { fullName: doctor.name, specialty: doctor.specialty },
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router



