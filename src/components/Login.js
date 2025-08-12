"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const success = await login(email, password)
    if (!success) {
      setError("Invalid email or password")
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Healthcare System Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Demo Accounts</h3>
          <p>
            <strong>👤 Patient:</strong> patient@demo.com / patient123
          </p>
          <p>
            <strong>👨‍⚕️ Doctor:</strong> doctor@demo.com / doctor123
          </p>
          <p>
            <strong>💰 Finance:</strong> finance@demo.com / finance123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
