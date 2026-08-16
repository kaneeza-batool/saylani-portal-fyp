import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getMe()
      .then(setStudent)
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (cnic, password) => {
    const loggedInStudent = await authService.login(cnic, password);
    setStudent(loggedInStudent);
    return loggedInStudent;
  }, []);

  const completeSetPassword = useCallback(async (cnic, password, phone) => {
    const newStudent = await authService.setPassword(cnic, password, phone);
    setStudent(newStudent);
    return newStudent;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setStudent(null);
  }, []);

  // Re-pulls the current student from the server — used after profile edits
  // or an avatar upload so the Sidebar/TopBar reflect changes immediately,
  // without a full page reload.
  const refreshStudent = useCallback(async () => {
    const freshStudent = await authService.getMe();
    setStudent(freshStudent);
    return freshStudent;
  }, []);

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, completeSetPassword, refreshStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
