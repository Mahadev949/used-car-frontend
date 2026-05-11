import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout, LoginData, RegisterData } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        getCurrentUser()
          .then((response) => {
            if (response.success) {
              setUser(response.user);
              localStorage.setItem('user', JSON.stringify(response.user));
            } else {
              apiLogout();
              setUser(null);
            }
          })
          .catch(() => {
            apiLogout();
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (error) {
        apiLogout();
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: LoginData) => {
    const response = await apiLogin(data);
    if (response.success && response.user) {
      setUser(response.user);
    } else {
      throw new Error(response.error || response.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    const response = await apiRegister(data);
    if (response.success && response.user) {
      setUser(response.user);
    } else {
      throw new Error(response.error || response.message || 'Registration failed');
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

