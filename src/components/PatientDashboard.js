"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useDatabase } from "../context/DatabaseContext"

const PatientDashboard = () => {
  const { user, logout } = useAuth()
  const { visits, doctors, addVisit } = useDatabase()
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [showBooking, setShowBooking] = useState(false)

  const patientVisits = visits.filter((visit) => visit.patientId === user?.id)
  const availableDoctors = doctors;
  

  const handleBookVisit = (e) => {
    e.preventDefault()
    if (!selectedDoctor || !visitDate || !user) return

    const doctor = doctors.find((d) => d.id === selectedDoctor)
    if (!doctor) return

    addVisit({
      patientId: user.id,
      patientName: user.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: visitDate,
      status: "scheduled",
      treatments: [],
      notes: "",
    })

    setSelectedDoctor("")
    setVisitDate("")
    setShowBooking(false)
    alert("✅ Visit booked successfully!")
  }

  const scheduledVisits = patientVisits.filter((v) => v.status === "scheduled")
  const completedVisits = patientVisits.filter((v) => v.status === "completed")
  const totalSpent = completedVisits.reduce((sum, visit) => sum + visit.totalAmount, 0)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Visits</h3>
            <p className="stat-number">{patientVisits.length}</p>
          </div>
          <div className="stat-card">
            <h3>Scheduled Visits</h3>
            <p className="stat-number">{scheduledVisits.length}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Visits</h3>
            <p className="stat-number">{completedVisits.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <p className="stat-number">${totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="actions">
          <button onClick={() => setShowBooking(!showBooking)} className="primary-btn">
            {showBooking ? "Cancel Booking" : "📅 Book New Visit"}
          </button>
        </div>

        {showBooking && (
          <div className="booking-form">
            <h3>Book a New Visit</h3>
            <form onSubmit={handleBookVisit}>
              <div className="form-group">
                <label htmlFor="doctor">Select Doctor</label>
                <select id="doctor" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
                  <option value="">Choose a doctor...</option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="date">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  id="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  📅 Book Visit
                </button>
                <button type="button" onClick={() => setShowBooking(false)} className="secondary-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="visits-section">
          <h3>My Medical Visits</h3>
          {patientVisits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--gray-500)" }}>
              <p>📋 No visits found. Book your first appointment!</p>
            </div>
          ) : (
            <div className="visits-list">
              {patientVisits
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((visit) => (
                  <div key={visit.id} className={`visit-card ${visit.status}`}>
                    <div className="visit-header">
                      <h4>👨‍⚕️ Dr. {visit.doctorName}</h4>
                      <span className={`status ${visit.status}`}>
                        {visit.status === "scheduled" && "⏰ "}
                        {visit.status === "in-progress" && "🔄 "}
                        {visit.status === "completed" && "✅ "}
                        {visit.status.replace("-", " ").toUpperCase()}
                      </span>
                    </div>
                    <p>
                      <strong>📅 Date:</strong> {new Date(visit.date).toLocaleString()}
                    </p>
                    <p>
                      <strong>💰 Total Amount:</strong> ${visit.totalAmount.toFixed(2)}
                    </p>
                    {visit.treatments.length > 0 && (
                      <div className="treatments">
                        <strong>💊 Treatments:</strong>
                        <ul>
                          {visit.treatments.map((treatment) => (
                            <li key={treatment.id}>
                              • {treatment.name} - ${treatment.cost.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {visit.notes && (
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "1rem",
                          backgroundColor: "var(--gray-50)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <strong>📝 Doctor's Notes:</strong>
                        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>{visit.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
