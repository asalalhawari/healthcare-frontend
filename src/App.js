"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./components/Login"
import PatientDashboard from "./components/PatientDashboard"
import DoctorDashboard from "./components/DoctorDashboard"
import FinanceDashboard from "./components/FinanceDashboard"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { DatabaseProvider } from "./context/DatabaseContext"
import "./App.css"

function AppRoutes() {
  const { user } = useAuth()

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user.type === "patient" ? (
            <PatientDashboard />
          ) : user.type === "doctor" ? (
            <DoctorDashboard />
          ) : user.type === "finance" ? (
            <FinanceDashboard />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </DatabaseProvider>
  )
}

export default App
