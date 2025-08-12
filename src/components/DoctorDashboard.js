"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useDatabase } from "../context/DatabaseContext"

const DoctorDashboard = () => {
  const { user, logout } = useAuth()
  const { visits, updateVisit, addTreatment, removeTreatment, setDoctorAvailability, doctors } = useDatabase()
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [newTreatment, setNewTreatment] = useState({ name: "", cost: 0 })
  const [visitNotes, setVisitNotes] = useState("")

  const doctorVisits = visits.filter((visit) => visit.doctorId === user?.id)
  const currentDoctor = doctors.find((d) => d.id === user?.id)
  const activeVisit = doctorVisits.find((visit) => visit.status === "in-progress")
  const scheduledVisits = doctorVisits.filter((visit) => visit.status === "scheduled")
  const completedVisits = doctorVisits.filter((visit) => visit.status === "completed")

  const startVisit = (visitId) => {
    if (activeVisit) {
      alert("⚠️ You already have an active visit. Please complete it first.")
      return
    }

    updateVisit(visitId, { status: "in-progress" })
    setSelectedVisit(visitId)
    setDoctorAvailability(user.id, false)
  }

  const completeVisit = (visitId) => {
    const visit = visits.find((v) => v.id === visitId)
    if (!visit) return

    if (visit.treatments.length === 0) {
      alert("⚠️ Please add at least one treatment before completing the visit.")
      return
    }

    updateVisit(visitId, {
      status: "completed",
      notes: visitNotes,
    })
    setSelectedVisit(null)
    setVisitNotes("")
    setDoctorAvailability(user.id, true)
    alert("✅ Visit completed successfully!")
  }

  const handleAddTreatment = (e) => {
    e.preventDefault()
    if (!selectedVisit || !newTreatment.name || newTreatment.cost <= 0) return

    addTreatment(selectedVisit, newTreatment)
    setNewTreatment({ name: "", cost: 0 })
  }

  const currentVisit = selectedVisit ? visits.find((v) => v.id === selectedVisit) : null
  const totalRevenue = completedVisits.reduce((sum, visit) => sum + visit.totalAmount, 0)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, Dr. {user?.name}</span>
          <span className={`availability ${currentDoctor?.isAvailable ? "available" : "busy"}`}>
            {currentDoctor?.isAvailable ? "🟢 Available" : "🔴 Busy"}
          </span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Patients</h3>
            <p className="stat-number">{doctorVisits.length}</p>
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
            <h3>Total Revenue</h3>
            <p className="stat-number">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {activeVisit && (
          <div className="active-visit">
            <h3>🔴 Current Active Visit</h3>
            <div className="visit-details">
              <p>
                <strong>👤 Patient:</strong> {activeVisit.patientName}
              </p>
              <p>
                <strong>📅 Date:</strong> {new Date(activeVisit.date).toLocaleString()}
              </p>
              <p>
                <strong>💰 Current Total:</strong> ${activeVisit.totalAmount.toFixed(2)}
              </p>
              <p>
                <strong>💊 Treatments Added:</strong> {activeVisit.treatments.length}
              </p>
            </div>
          </div>
        )}

        <div className="visits-section">
          <h3>📋 Scheduled Appointments</h3>
          {scheduledVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              <p>📅 No scheduled visits at the moment.</p>
            </div>
          ) : (
            <div className="visits-list">
              {scheduledVisits
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((visit) => (
                <div key={visit.id} className="visit-card">
                  <div className="visit-header">
                    <h4>👤 {visit.patientName}</h4>
                    <button 
                      onClick={() => startVisit(visit.id)} 
                      className="primary-btn" 
                      disabled={!!activeVisit}
                    >
                      {activeVisit ? "🔒 Busy" : "▶️ Start Visit"}
                    </button>
                  </div>
                  <p>
                    <strong>📅 Scheduled:</strong> {new Date(visit.date).toLocaleString()}
                  </p>
                  <p>
                    <strong>⏰ Status:</strong> <span className="status scheduled">Waiting</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {currentVisit && currentVisit.status === "in-progress" && (
          <div className="visit-management">
            <h3>👨‍⚕️ Managing Visit - {currentVisit.patientName}</h3>

            <div className="treatments-section">
              <h4>💊 Add Treatment</h4>
              <form onSubmit={handleAddTreatment} className="treatment-form">
                <div className="form-group">
                  <label htmlFor="treatmentName">Treatment Name</label>
                  <input
                    type="text"
                    id="treatmentName"
                    value={newTreatment.name}
                    onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                    placeholder="e.g., Blood Test, X-Ray, Consultation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="treatmentCost">Cost ($)</label>
                  <input
                    type="number"
                    id="treatmentCost"
                    min="0"
                    step="0.01"
                    value={newTreatment.cost}
                    onChange={(e) => setNewTreatment({ ...newTreatment, cost: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <button type="submit" className="primary-btn">
                  ➕ Add Treatment
                </button>
              </form>

              <div className="current-treatments">
                <h4>📋 Current Treatments</h4>
                {currentVisit.treatments.length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>
                    No treatments added yet. Add treatments above.
                  </p>
                ) : (
                  <ul>
                    {currentVisit.treatments.map((treatment) => (
                      <li key={treatment.id} className="treatment-item">
                        <span>
                          💊 {treatment.name} - <strong>${treatment.cost.toFixed(2)}</strong>
                        </span>
                        <button 
                          onClick={() => removeTreatment(currentVisit.id, treatment.id)} 
                          className="remove-btn"
                        >
                          🗑️ Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: 'var(--secondary-green-light)', 
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--secondary-green)'
                }}>
                  <strong style={{ fontSize: '1.125rem' }}>
                    💰 Total Amount: ${currentVisit.totalAmount.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="notes-section">
              <h4>📝 Medical Notes & Diagnosis</h4>
              <textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Add detailed notes about the patient's condition, diagnosis, recommendations, etc..."
                rows={6}
                style={{ width: '100%', minHeight: '120px' }}
              />
            </div>

            <button 
              onClick={() => completeVisit(currentVisit.id)} 
              className="complete-btn"
              style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
            >
              ✅ Complete Visit & Generate Bill
            </button>
          </div>
        )}

        <div className="completed-visits">
          <h3>✅ Recent Completed Visits</h3>
          {completedVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              <p>📋 No completed visits yet.</p>
            </div>
          ) : (
            <div className="visits-list">
              {completedVisits
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map((visit) => (
                <div key={visit.id} className="visit-card completed">
                  <div className="visit-header">
                    <h4>👤 {visit.patientName}</h4>
                    <span className="status completed">✅ Completed</span>
                  </div>
                  <p>
                    <strong>📅 Date:</strong> {new Date(visit.date).toLocaleString()}
                  </p>
                  <p>
                    <strong>💰 Total Amount:</strong> ${visit.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>💊 Treatments:</strong> {visit.treatments.length} items
                  </p>
                  {visit.notes && (
                    <p>
                      <strong>📝 Notes:</strong> {visit.notes.substring(0, 100)}
                      {visit.notes.length > 100 && '...'}
                    </p>
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

export default DoctorDashboard
