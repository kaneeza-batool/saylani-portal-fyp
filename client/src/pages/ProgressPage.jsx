import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProgress } from '../services/progressService';
import CircularProgress from '../components/CircularProgress';
import { CheckCircleIcon, ClockIcon, ChevronDownIcon } from '../components/icons';

function ModuleRow({ module, expanded, onToggle }) {
  const isComplete = module.percentage === 100;

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
      >
        {isComplete ? (
          <CheckCircleIcon className="w-5 h-5 text-success-text shrink-0" />
        ) : (
          <ClockIcon className="w-5 h-5 text-warning-text shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{module.moduleName}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Topics: {module.completedTopics}/{module.totalTopics}
          </p>
        </div>

        <CircularProgress percentage={module.percentage} size={40} strokeWidth={4} labelClassName="text-[10px]" />

        <ChevronDownIcon
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div data-testid="module-topics" className="px-4 sm:px-5 pb-4 pl-12 sm:pl-14 flex flex-col gap-2.5">
          {module.topics.map((t) => (
            <div key={t._id} className="flex items-center gap-2.5 text-sm">
              {t.isCompleted ? (
                <CheckCircleIcon className="w-4 h-4 text-success-text shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-neutral-300 shrink-0" />
              )}
              <span className={t.isCompleted ? 'text-neutral-700' : 'text-neutral-400'}>{t.topicName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 sm:px-5 py-4 border-b border-neutral-100 last:border-b-0 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-neutral-200 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-40 bg-neutral-200 rounded" />
        <div className="h-3 w-24 bg-neutral-200 rounded" />
      </div>
      <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
    </div>
  );
}

export default function ProgressPage() {
  const { courseId } = useParams();
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => getProgress(courseId),
  });

  function toggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex items-center gap-5">
        {isLoading ? (
          <>
            <div className="w-16 h-16 rounded-full bg-neutral-200 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 w-64 bg-neutral-200 rounded animate-pulse" />
            </div>
          </>
        ) : isError ? (
          <p className="text-sm font-medium text-neutral-500">Couldn't load your overall progress.</p>
        ) : (
          <>
            <CircularProgress percentage={data.overallPercentage} size={72} strokeWidth={6} labelClassName="text-sm" />
            <div>
              <p className="font-heading text-lg font-bold text-neutral-900">Overall Course Progress</p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {data.completedTopics} of {data.totalTopics} topics completed across {data.modules.length} modules
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Modules</h3>
        </div>

        {isLoading ? (
          <>
            <ModuleRowSkeleton />
            <ModuleRowSkeleton />
            <ModuleRowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load your progress.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : data.modules.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No modules assigned yet.</p>
          </div>
        ) : (
          data.modules.map((m) => (
            <ModuleRow key={m._id} module={m} expanded={expandedId === m._id} onToggle={() => toggle(m._id)} />
          ))
        )}
      </div>
    </div>
  );
}
