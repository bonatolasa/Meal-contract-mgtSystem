import { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe().then((res) => setUser(res.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, role, phone, address) => {
    const res = await registerUser(name, email, password, role, phone, address);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    homePath: user?.role === 'student' ? '/student/dashboard' : user?.role === 'employee' ? '/employee/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/owner/dashboard',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
