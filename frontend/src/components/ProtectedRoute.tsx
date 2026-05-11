import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRole?: 'user' | 'dealer' | 'admin';
}

const ProtectedRoute = ({ children, requireAdmin = false, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-secondary text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check for specific role requirement
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to user's appropriate portal
    if (user?.role === 'user') {
      return <Navigate to="/user" replace />;
    } else if (user?.role === 'dealer') {
      return <Navigate to="/dealer" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

