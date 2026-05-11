import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/user', label: 'User Portal', requireAuth: true, requiredRole: 'user' },
    { path: '/dealer', label: 'Dealer Portal', requireAuth: true, requiredRole: 'dealer' },
    { path: '/admin', label: 'Admin Portal', requireAuth: true, requiredRole: 'admin' },
    { path: '/datascience', label: 'Data Science', requireAuth: true, requiredRole: 'admin' },
  ].filter((item) => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.requiredRole && user?.role !== item.requiredRole) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-primary border-b border-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-secondary">🚗 CarPrice AI</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                    ? 'bg-secondary text-primary'
                    : 'text-gray-300 hover:bg-secondary/20 hover:text-secondary'
                  }`}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-secondary/20">
                <span className="text-sm text-gray-300">
                  {user?.username} {isAdmin && <span className="text-accent">(Admin)</span>}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-secondary/20 hover:text-secondary transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-secondary/20">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-secondary/20 hover:text-secondary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-secondary text-primary hover:bg-secondary/90 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

