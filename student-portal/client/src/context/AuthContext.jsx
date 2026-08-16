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

  // portalAccess is false for a student whose admission is still pending/
  // rejected/dropped — the password really was set, but no session cookie
  // was issued (see authController.setPassword), so `student` state stays
  // null here rather than looking logged in on a session that doesn't
  // actually exist. The caller (LoginPage's CreatePasswordForm) checks the
  // returned portalAccess/message instead of assuming success means login.
  const completeSetPassword = useCallback(async (cnic, password) => {
    const result = await authService.setPassword(cnic, password);
    if (result.portalAccess) setStudent(result.student);
    return result;
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
