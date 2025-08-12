"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useDatabase } from "../context/DatabaseContext"

const FinanceDashboard = () => {
  const { user, logout } = useAuth()
  const { visits, searchVisits } = useDatabase()
  const [searchQuery, setSearchQuery] = useState({
    doctorName: "",
    patientName: "",
    visitId: "",
  })
  const [filteredVisits, setFilteredVisits] = useState(visits)

  const completedVisits = visits.filter((visit) => visit.status === "completed")
  const totalRevenue = completedVisits.reduce((sum, visit) => sum + visit.totalAmount, 0)
  const averageVisitCost = completedVisits.length > 0 ? totalRevenue / completedVisits.length : 0

  const handleSearch = () => {
    const results = searchVisits(searchQuery)
    setFilteredVisits(results)
  }

  const clearSearch = () => {
    setSearchQuery({ doctorName: "", patientName: "", visitId: "" })
    setFilteredVisits(visits)
  }

  useEffect(() => {
    setFilteredVisits(visits)
  }, [visits])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Finance Dashboard</h1>
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
            <p className="stat-number">{visits.length}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Visits</h3>
            <p className="stat-number">{completedVisits.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-number">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Average Visit Cost</h3>
            <p className="stat-number">${averageVisitCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="search-section">
          <h3>Search Visits</h3>
          <div className="search-form">
            <div className="search-inputs">
              <div className="form-group">
                <label htmlFor="doctorName">Doctor Name:</label>
                <input
                  type="text"
                  id="doctorName"
                  value={searchQuery.doctorName}
                  onChange={(e) => setSearchQuery({ ...searchQuery, doctorName: e.target.value })}
                  placeholder="Search by doctor name..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="patientName">Patient Name:</label>
                <input
                  type="text"
                  id="patientName"
                  value={searchQuery.patientName}
                  onChange={(e) => setSearchQuery({ ...searchQuery, patientName: e.target.value })}
                  placeholder="Search by patient name..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="visitId">Visit ID:</label>
                <input
                  type="text"
                  id="visitId"
                  value={searchQuery.visitId}
                  onChange={(e) => setSearchQuery({ ...searchQuery, visitId: e.target.value })}
                  placeholder="Search by visit ID..."
                />
              </div>
            </div>
            <div className="search-actions">
              <button onClick={handleSearch} className="primary-btn">
                Search
              </button>
              <button onClick={clearSearch} className="secondary-btn">
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="visits-section">
          <h3>Visit Records ({filteredVisits.length} found)</h3>
          {filteredVisits.length === 0 ? (
            <p>No visits found matching your search criteria.</p>
          ) : (
            <div className="visits-table">
              <table>
                <thead>
                  <tr>
                    <th>Visit ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Treatments</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td>{visit.id}</td>
                      <td>{visit.patientName}</td>
                      <td>{visit.doctorName}</td>
                      <td>{new Date(visit.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status ${visit.status}`}>{visit.status}</span>
                      </td>
                      <td>{visit.treatments.length}</td>
                      <td>${visit.totalAmount.toFixed(2)}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => {
                            const details = `
Visit Details:
- ID: ${visit.id}
- Patient: ${visit.patientName}
- Doctor: ${visit.doctorName}
- Date: ${new Date(visit.date).toLocaleString()}
- Status: ${visit.status}
- Notes: ${visit.notes || "No notes"}

Treatments:
${visit.treatments.map((t) => `- ${t.name}: $${t.cost}`).join("\n")}

Total Amount: $${visit.totalAmount}
                            `
                            alert(details)
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="revenue-analysis">
          <h3>Revenue Analysis</h3>
          <div className="analysis-grid">
            <div className="analysis-card">
              <h4>By Status</h4>
              <ul>
                <li>Scheduled: {visits.filter((v) => v.status === "scheduled").length} visits</li>
                <li>In Progress: {visits.filter((v) => v.status === "in-progress").length} visits</li>
                <li>Completed: {completedVisits.length} visits</li>
              </ul>
            </div>
            <div className="analysis-card">
              <h4>Revenue Breakdown</h4>
              <ul>
                <li>Completed Revenue: ${totalRevenue.toFixed(2)}</li>
                <li>
                  Pending Revenue: $
                  {visits
                    .filter((v) => v.status !== "completed")
                    .reduce((sum, v) => sum + v.totalAmount, 0)
                    .toFixed(2)}
                </li>
                <li>Average per Visit: ${averageVisitCost.toFixed(2)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceDashboard
