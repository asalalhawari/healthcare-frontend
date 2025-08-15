"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./AuthContext"

const DatabaseContext = createContext(undefined)

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider")
  }
  return context
}

export const DatabaseProvider = ({ children }) => {
  const [visits, setVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // استخدام useCallback لتحسين دوال التحديث
  const refreshVisits = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3002/api"}/visits`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const visitsData = await response.json()
        setVisits(visitsData)
      }
    } catch (error) {
      console.error("Failed to fetch visits:", error)
    } finally {
      setLoading(false)
    }
  }, [user]) // التبعيات: `refreshVisits` تعتمد على `user`

  const refreshDoctors = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3002/api"}/users`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const usersData = await response.json()
        const doctorsData = usersData.filter((user) => user.role === "doctor")
        setDoctors(doctorsData)
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
    }
  }, [user]) // التبعيات: `refreshDoctors` تعتمد على `user`

  useEffect(() => {
    if (user) {
      refreshVisits()
      refreshDoctors()
    }
  }, [user, refreshVisits, refreshDoctors])  // التبعيات الآن ثابتة بفضل `useCallback`

  const addVisit = async (visitData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3002/api"}/visits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitData),
      })

      if (response.ok) {
        await refreshVisits()
      }
    } catch (error) {
      console.error("Failed to create visit:", error)
    }
  }

  const updateVisit = async (visitId, updates) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3002/api"}/visits/${visitId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        },
      )

      if (response.ok) {
        await refreshVisits()
      }
    } catch (error) {
      console.error("Failed to update visit:", error)
    }
  }

  const addTreatment = (visitId, treatmentData) => {
    const visit = visits.find((v) => v.id === visitId)
    if (visit) {
      const updatedTreatments = [...visit.treatments, { ...treatmentData, id: Date.now().toString() }]
      updateVisit(visitId, { treatments: updatedTreatments })
    }
  }

  const removeTreatment = (visitId, treatmentId) => {
    const visit = visits.find((v) => v.id === visitId)
    if (visit) {
      const updatedTreatments = visit.treatments.filter((t) => t.id !== treatmentId)
      updateVisit(visitId, { treatments: updatedTreatments })
    }
  }

  const setDoctorAvailability = async (doctorId, isAvailable) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3000/api"}/users/${doctorId}/availability`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable }),
        },
      )

      if (response.ok) {
        await refreshDoctors()
      }
    } catch (error) {
      console.error("Failed to update availability:", error)
    }
  }

  const searchVisits = (query) => {
    return visits.filter((visit) => {
      const matchesDoctor = !query.doctorName || visit.doctorName.toLowerCase().includes(query.doctorName.toLowerCase())
      const matchesPatient =
        !query.patientName || visit.patientName.toLowerCase().includes(query.patientName.toLowerCase())
      const matchesId = !query.visitId || visit.id.includes(query.visitId)

      return matchesDoctor && matchesPatient && matchesId
    })
  }

  return (
    <DatabaseContext.Provider
      value={{
        visits,
        doctors,
        loading,
        addVisit,
        updateVisit,
        addTreatment,
        removeTreatment,
        setDoctorAvailability,
        searchVisits,
        refreshVisits,
        refreshDoctors,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  )
}
