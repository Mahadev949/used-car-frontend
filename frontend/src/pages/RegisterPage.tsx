import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const portalOptions = [
    { value: 'user', label: '👤 User Portal - Get price predictions', description: 'Access to prediction features and history' },
    { value: 'dealer', label: '🏪 Dealer Portal - Market analytics', description: 'Access to bulk upload and market trends' },
    { value: 'admin', label: '⚙️ Admin Portal - System management', description: 'Full access to all features and admin controls' },
  ];

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      // Get user role from localStorage (set by register function)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'user') {
            navigate('/user');
          } else if (userData.role === 'dealer') {
            navigate('/dealer');
          } else if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Handle different error formats
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-secondary/10 p-8 rounded-lg border border-secondary/20">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Register</h1>
        <p className="text-gray-300 text-center mb-6">Create a new account to get started.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Portal / Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-primary border border-secondary/30 rounded px-3 py-2 text-white focus:outline-none focus:border-secondary"
              required
            >
              {portalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-primary/50 rounded border border-secondary/10">
              <p className="text-xs text-gray-300 font-medium">
                {portalOptions.find(opt => opt.value === formData.role)?.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {portalOptions.find(opt => opt.value === formData.role)?.description}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-primary py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

