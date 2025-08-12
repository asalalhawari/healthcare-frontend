"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // Mock users for demo
  const mockUsers = [
    { id: "1", name: "John Patient", email: "patient@demo.com", password: "patient123", type: "patient" },
    { id: "2", name: "Dr. Smith", email: "doctor@demo.com", password: "doctor123", type: "doctor" },
    { id: "3", name: "Finance Manager", email: "finance@demo.com", password: "finance123", type: "finance" },
    { id: "4", name: "Dr. Johnson", email: "doctor2@demo.com", password: "doctor123", type: "doctor" },
  ]

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email, password) => {
    const foundUser = mockUsers.find((u) => u.email === email && u.password === password)
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
