import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllNotifications, markNotificationRead } from '../services/notificationService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { BellIcon } from '../components/icons';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 sm:px-5 py-4 animate-pulse">
      <div className="w-8 h-8 rounded-pill bg-neutral-200 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/3 bg-neutral-200 rounded" />
        <div className="h-3 w-2/3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: getAllNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-primary-800" />
          <h3 className="font-heading text-lg font-bold text-neutral-900">All Notifications</h3>
        </div>

        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load your notifications.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No notifications yet.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col divide-y divide-neutral-100"
          >
            {notifications.map((n) => {
              const rowClass = `flex items-start gap-3 px-4 sm:px-5 py-4 ${n.isRead ? 'bg-white' : 'bg-info-bg/40'} ${
                n.link ? 'hover:bg-neutral-50 transition-colors cursor-pointer' : ''
              }`;
              const content = (
                <>
                  <span className="text-lg leading-none shrink-0 mt-0.5">{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm flex items-center flex-wrap gap-1.5 ${n.isRead ? 'font-medium text-neutral-700' : 'font-bold text-neutral-900'}`}>
                      {n.title}
                      {!n.isRead && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-accent-700 bg-accent-500/20 rounded-pill px-1.5 py-0.5">
                          Unread
                        </span>
                      )}
                      {n.isDismissed && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-100 rounded-pill px-1.5 py-0.5">
                          Dismissed
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">{n.message}</p>
                    <p className="text-xs text-neutral-400 mt-1.5">{formatTimestamp(n.createdAt)}</p>
                  </div>
                </>
              );

              // Only notifications with somewhere to go (see link on the
              // model) navigate on click — purely informational ones (no
              // link) stay a static row, same as before.
              return n.link ? (
                <motion.div key={n._id} variants={fadeInUp} data-testid="notification-history-item" data-read={n.isRead} data-dismissed={n.isDismissed}>
                  <Link
                    to={n.link}
                    onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
                    className={`${rowClass} no-underline text-inherit`}
                  >
                    {content}
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key={n._id}
                  variants={fadeInUp}
                  data-testid="notification-history-item"
                  data-read={n.isRead}
                  data-dismissed={n.isDismissed}
                  className={rowClass}
                >
                  {content}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
