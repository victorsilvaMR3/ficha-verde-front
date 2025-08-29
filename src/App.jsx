import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Consultation from './pages/Consultation'
import WaitingRoom from './pages/WaitingRoom'
import VideoCall from './components/VideoCall'
import DoctorPanel from './pages/DoctorPanel'
import ProtectedRoute from './components/ProtectedRoute'
import Credits from './pages/Credits'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/consultation/:id" element={<Consultation />} />
          <Route path="/waiting-room/:id" element={<WaitingRoom />} />
          <Route path="/video-call/:id" element={<VideoCall />} />
          <Route path="/creditos" element={<Credits />} />
          
          {/* Doctor only routes */}
          <Route 
            path="/doctor-panel" 
            element={
              user?.role === 'DOCTOR' ? <DoctorPanel /> : <Navigate to="/dashboard" />
            } 
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App 