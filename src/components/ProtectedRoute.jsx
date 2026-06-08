import { Navigate } from 'react-router-dom'
import { useAuth }  from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { currentUser, userProfile } = useAuth()
  if (!currentUser) return <Navigate to="/" replace />
  if (allowedRole && userProfile?.role !== allowedRole) return <Navigate to="/" replace />
  return children
}
