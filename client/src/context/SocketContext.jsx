import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// socket.io connects at the server root, not under /api.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [liveAuditEvents, setLiveAuditEvents] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('audit:new', (entry) => setLiveAuditEvents((prev) => [entry, ...prev].slice(0, 30)));
    socket.on('alert:new', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 30));
      setUnreadAlertCount((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, queryClient]);

  const clearUnread = () => setUnreadAlertCount(0);

  return (
    <SocketContext.Provider value={{ connected, liveAuditEvents, liveAlerts, unreadAlertCount, clearUnread }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketData() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketData must be used within a SocketProvider');
  return ctx;
}
