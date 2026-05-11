import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import UserPortal from './pages/UserPortal';
import DealerPortal from './pages/DealerPortal';
import AdminPortal from './pages/AdminPortal';
import DataSciencePortal from './pages/DataSciencePortal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/user"
              element={
                <ProtectedRoute requiredRole="user">
                  <UserPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealer"
              element={
                <ProtectedRoute requiredRole="dealer">
                  <DealerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/datascience"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DataSciencePortal />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

