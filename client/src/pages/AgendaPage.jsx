import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getMyWeekAgenda } from '../services/agendaService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { AssignmentIcon, QuizIcon, CalendarIcon } from '../components/icons';

const TYPE_META = {
  assignment: { Icon: AssignmentIcon, tone: 'text-warning-text bg-warning-bg' },
  quiz: { Icon: QuizIcon, tone: 'text-info-text bg-info-bg' },
  class: { Icon: CalendarIcon, tone: 'text-primary-800 bg-primary-100' },
};

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDay(items) {
  const groups = [];
  const byKey = new Map();
  for (const item of items) {
    const key = new Date(item.date).toDateString();
    if (!byKey.has(key)) {
      const group = { key, label: dayLabel(item.date), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).items.push(item);
  }
  return groups;
}

function AgendaRow({ item }) {
  const { Icon, tone } = TYPE_META[item.type];
  return (
    <motion.div variants={fadeInUp}>
      <Link
        to={item.link}
        data-testid="agenda-item"
        data-course={item.courseName}
        className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-neutral-50 transition-colors"
      >
        <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary-800 bg-primary-100 rounded-pill px-1.5 py-0.5">
              {item.courseName}
            </span>
            <span className="text-xs text-neutral-400">{item.meta}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 animate-pulse">
      <div className="w-9 h-9 rounded-md bg-neutral-200 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/2 bg-neutral-200 rounded" />
        <div className="h-3 w-1/3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['agenda'],
    queryFn: getMyWeekAgenda,
  });

  const groups = data ? groupByDay(data.items) : [];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">My Week</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Everything due, available, or scheduled across both your courses for the next 7 days.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load your agenda.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">Nothing due or scheduled in the next 7 days. Enjoy the breather.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="border-b border-neutral-100 last:border-b-0">
              <p className="px-4 sm:px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-neutral-400 bg-neutral-50">
                {group.label}
              </p>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-neutral-100">
                {group.items.map((item, i) => (
                  <AgendaRow key={`${item.type}-${item.courseId}-${item.title}-${i}`} item={item} />
                ))}
              </motion.div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
