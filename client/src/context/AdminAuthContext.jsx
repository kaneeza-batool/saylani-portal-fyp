import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/auth/me`, { withCredentials: true });
      setAdmin(res.data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const res = await axios.post(
      `${API_URL}/api/admin/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setAdmin(res.data.admin);
    return res.data.admin;
  };

  const logout = async () => {
    await axios.post(`${API_URL}/api/admin/auth/logout`, {}, { withCredentials: true });
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);

export default AdminAuthContext;
