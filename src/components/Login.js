"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const success = await login(username, password)
    if (!success) {
      setError("Invalid username or password")
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Healthcare System Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Demo Accounts:</h3>
          <p>
            <strong>Patient:</strong> patient1 / password123
          </p>
          <p>
            <strong>Doctor:</strong> doctor1 / password123
          </p>
          <p>
            <strong>Finance:</strong> finance1 / password123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
