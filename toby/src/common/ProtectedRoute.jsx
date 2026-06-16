import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" replace />;
  if (requiredRole && localStorage.getItem('rol') !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}
