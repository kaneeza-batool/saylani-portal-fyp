import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, dismissNotification } from '../services/notificationService';
import { BellIcon, CloseIcon } from './icons';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const dismissMutation = useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative w-9 h-9 shrink-0 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-pill bg-danger-text text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[85vw] bg-white rounded-lg shadow-modal border border-neutral-200 overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-bold text-neutral-900">Notifications</p>
            {unreadCount > 0 && <span className="text-xs text-neutral-400">{unreadCount} unread</span>}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  data-testid="notification-item"
                  data-read={n.isRead}
                  className={`group w-full flex items-start gap-2 px-4 py-3 transition-colors ${
                    n.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-info-bg/50 hover:bg-info-bg'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <span className="text-lg leading-none shrink-0">{n.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.isRead ? 'font-medium text-neutral-700' : 'font-bold text-neutral-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissMutation.mutate(n._id)}
                    data-testid="notification-dismiss"
                    aria-label="Dismiss notification"
                    title="Dismiss"
                    className="shrink-0 w-6 h-6 mt-0.5 rounded-md flex items-center justify-center text-neutral-300 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm font-semibold text-primary-800 hover:text-primary-900 px-4 py-2.5 border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
