import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // React Query's cache is keyed by query params (e.g. ['students', {...}]),
  // not by who's asking — without clearing it here, a campus-scoped user can
  // see another user's cached, differently-scoped results for the same key.
  const login = useCallback(
    async (email, password) => {
      queryClient.clear();
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateProfile = useCallback(async (payload) => {
    const updatedUser = await authService.updateMe(payload);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
