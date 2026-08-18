import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [realUser, setRealUser] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setIsImpersonating(res.data.isImpersonating || false);
        setRealUser(res.data.realUser || null);
      }
    } catch (err) {
      console.error('Fetch me error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('impersonateUserId');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.removeItem('impersonateUserId');
      await fetchCurrentUser();
    }
    return res.data;
  };

  const register = async (name, email, password, leetcodeUsername) => {
    const res = await api.post('/auth/register', { name, email, password, leetcodeUsername });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.removeItem('impersonateUserId');
      await fetchCurrentUser();
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('impersonateUserId');
    setUser(null);
    setRealUser(null);
    setIsImpersonating(false);
  };

  const startImpersonating = (targetUserId) => {
    localStorage.setItem('impersonateUserId', targetUserId);
    return fetchCurrentUser();
  };

  const stopImpersonating = () => {
    localStorage.removeItem('impersonateUserId');
    return fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      realUser,
      isImpersonating,
      loading,
      login,
      register,
      logout,
      startImpersonating,
      stopImpersonating,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
