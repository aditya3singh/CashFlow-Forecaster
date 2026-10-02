/**
 * Auth Context — manages authentication state across the app.
 *
 * Provides login, signup, logout functions and user state.
 * Wraps the app so any component can access auth status.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (err) {
        // Token invalid/expired — clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signup = useCallback(async (email, password, businessName) => {
    setError(null);
    try {
      const response = await authAPI.signup({
        email,
        password,
        business_name: businessName,
      });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Load user profile
      const meResponse = await authAPI.getMe();
      setUser(meResponse.data);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Please make sure the backend is running.'
          : 'Signup failed. Please try again.');
      setError(message);
      return { success: false, message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Load user profile
      const meResponse = await authAPI.getMe();
      setUser(meResponse.data);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to reach the server. Please make sure the backend is running.'
          : 'Invalid email or password.');
      setError(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
