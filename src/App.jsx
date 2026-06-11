import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }   from './contexts/AuthContext'
import ProtectedRoute     from './components/ProtectedRoute'
import Landing            from './pages/Landing'
import StudentDashboard   from './pages/Student'
import TeacherDashboard   from './pages/Teacher'
import AdminDashboard     from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/student" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/teacher" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
