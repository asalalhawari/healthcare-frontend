"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import FinanceDashboard from "./components/FinanceDashboard";
import AddDoctor from "./components/AddDoctor";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DatabaseProvider } from "./context/DatabaseContext";
import "./App.css";

// PrivateRoute wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* Public login route */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes */}
      {user?.role == null && (
        <Route
          path="/"
          element={
            <PrivateRoute>
              {/* <PatientDashboard /> */}
            </PrivateRoute>
          }
        />
      )}
      {user?.role === "patient" && (
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PatientDashboard />
            </PrivateRoute>
          }
        />
      )}
      {user?.role === "doctor" && (
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DoctorDashboard />
            </PrivateRoute>
          }
        />
      )}
      {user?.role === "finance" && (
        <>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <FinanceDashboard />
              </PrivateRoute>
            }
          />
          {/* Route جديد لصفحة AddDoctor */}
          <Route
            path="/add-doctor"
            element={
              <PrivateRoute>
                <AddDoctor />
              </PrivateRoute>
            }
          />
        </>
      )}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;
