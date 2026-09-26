import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const PERMISSION_MAP = {
  // Campaigns
  CAMPAIGN_CREATE: ['ADMIN', 'MANAGER'],
  CAMPAIGN_READ: ['ADMIN', 'MANAGER', 'USER'],
  CAMPAIGN_UPDATE: ['ADMIN', 'MANAGER'],
  CAMPAIGN_DELETE: ['ADMIN'],
  CAMPAIGN_ASSIGN_USER: ['ADMIN', 'MANAGER'],

  // Events
  EVENT_CREATE: ['ADMIN', 'MANAGER', 'USER'],
  EVENT_READ: ['ADMIN', 'MANAGER', 'USER'],
  EVENT_UPDATE_STATUS: ['ADMIN', 'MANAGER'],
  EVENT_DELETE: ['ADMIN'],

  // Users
  USER_MANAGE: ['ADMIN'],
  USER_VIEW: ['ADMIN', 'MANAGER'],

  // Audit Logs
  AUDIT_LOGS_VIEW: ['ADMIN'],

  // Dashboard
  DASHBOARD_VIEW: ['ADMIN', 'MANAGER', 'USER'],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenant, setTenant] = useState(() => {
    const saved = localStorage.getItem('tenant');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate active token with /auth/me on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setTenant(response.data.tenant);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
        }
      } catch (error) {
        console.warn('Session verification failed, logging out:', error.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: newToken, user: newUser, tenant: newTenant } = response.data;
        setToken(newToken);
        setUser(newUser);
        setTenant(newTenant);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('tenant', JSON.stringify(newTenant));
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setTenant(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
    }
  };

  const quickSwitchPersona = async (email, password = 'Admin@123') => {
    return await login(email, password);
  };

  const can = (permission) => {
    if (!user) return false;
    const allowed = PERMISSION_MAP[permission];
    return allowed ? allowed.includes(user.role) : false;
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    tenant,
    token,
    loading,
    login,
    logout,
    quickSwitchPersona,
    can,
    hasRole,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
