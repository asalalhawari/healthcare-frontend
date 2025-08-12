"use client"

import { createContext, useContext, useState, useEffect } from "react"

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
  const [doctors, setDoctors] = useState([
    { id: "2", name: "Dr. Smith", email: "doctor@demo.com", specialty: "Cardiology", isAvailable: true },
    { id: "4", name: "Dr. Johnson", email: "doctor2@demo.com", specialty: "Neurology", isAvailable: true },
  ])

  useEffect(() => {
    const savedVisits = localStorage.getItem("visits")
    const savedDoctors = localStorage.getItem("doctors")

    if (savedVisits) {
      setVisits(JSON.parse(savedVisits))
    }
    if (savedDoctors) {
      setDoctors(JSON.parse(savedDoctors))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("visits", JSON.stringify(visits))
  }, [visits])

  useEffect(() => {
    localStorage.setItem("doctors", JSON.stringify(doctors))
  }, [doctors])

  const calculateTotal = (treatments) => {
    return treatments.reduce((sum, treatment) => sum + treatment.cost, 0)
  }

  const addVisit = (visitData) => {
    const newVisit = {
      ...visitData,
      id: Date.now().toString(),
      totalAmount: calculateTotal(visitData.treatments),
    }
    setVisits((prev) => [...prev, newVisit])
  }

  const updateVisit = (visitId, updates) => {
    setVisits((prev) =>
      prev.map((visit) => {
        if (visit.id === visitId) {
          const updatedVisit = { ...visit, ...updates }
          if (updates.treatments) {
            updatedVisit.totalAmount = calculateTotal(updates.treatments)
          }
          return updatedVisit
        }
        return visit
      }),
    )
  }

  const addTreatment = (visitId, treatmentData) => {
    const newTreatment = {
      ...treatmentData,
      id: Date.now().toString(),
    }

    setVisits((prev) =>
      prev.map((visit) => {
        if (visit.id === visitId) {
          const updatedTreatments = [...visit.treatments, newTreatment]
          return {
            ...visit,
            treatments: updatedTreatments,
            totalAmount: calculateTotal(updatedTreatments),
          }
        }
        return visit
      }),
    )
  }

  const removeTreatment = (visitId, treatmentId) => {
    setVisits((prev) =>
      prev.map((visit) => {
        if (visit.id === visitId) {
          const updatedTreatments = visit.treatments.filter((t) => t.id !== treatmentId)
          return {
            ...visit,
            treatments: updatedTreatments,
            totalAmount: calculateTotal(updatedTreatments),
          }
        }
        return visit
      }),
    )
  }

  const setDoctorAvailability = (doctorId, isAvailable) => {
    setDoctors((prev) => prev.map((doctor) => (doctor.id === doctorId ? { ...doctor, isAvailable } : doctor)))
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
        addVisit,
        updateVisit,
        addTreatment,
        removeTreatment,
        setDoctorAvailability,
        searchVisits,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  )
}
