'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check localStorage for existing token and validate
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lwa_token') : null;
    if (stored) {
      setToken(stored);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setUser(d.user);
            setProgress(d.progress || []);
            // Clean up old localStorage key
            localStorage.removeItem('lwa_userId');
          } else {
            localStorage.removeItem('lwa_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('lwa_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData, tokenStr, progressData) => {
    localStorage.setItem('lwa_token', tokenStr);
    setToken(tokenStr);
    setUser(userData);
    setProgress(progressData || []);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lwa_token');
    localStorage.removeItem('lwa_userId');
    setToken(null);
    setUser(null);
    setProgress([]);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const updateProgress = useCallback((newProgress) => {
    setProgress(newProgress);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, progress, token, loading, login, logout, updateUser, updateProgress }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
