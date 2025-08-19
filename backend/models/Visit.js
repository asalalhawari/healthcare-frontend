const visitId = "V" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

const result = await pool.query(
  `INSERT INTO visits
   (visit_id, patient_id, doctor_id, appointment_date, status, symptoms, diagnosis, treatments, total_amount, notes, is_paid)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
  [
    visitId,
    req.user.id,
    doctorId,
    new Date(date),
    "scheduled",
    symptoms,
    "",
    JSON.stringify([]),
    0,
    "",
    false,
  ]
);

const visit = result.rows[0];
