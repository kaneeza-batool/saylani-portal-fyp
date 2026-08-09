import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAssignments, getAssignmentSummary } from '../services/assignmentService';
import { StatCard, StatCardSkeleton } from '../components/StatCard';
import Toast from '../components/Toast';
import AssignmentInfoModal from '../components/AssignmentInfoModal';
import SubmitAssignmentModal from '../components/SubmitAssignmentModal';
import { EyeIcon, UploadIcon, EditIcon, DownloadIcon } from '../components/icons';

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  not_submitted: 'bg-neutral-100 text-neutral-500',
  submitted: 'bg-info-bg text-info-text',
  late_submitted: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  not_approved: 'bg-danger-bg text-danger-text',
};

const STATUS_LABEL = {
  not_submitted: 'Not Submitted',
  submitted: 'Submitted',
  late_submitted: 'Late Submitted',
  approved: 'Approved',
  not_approved: 'Not Approved',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function urgency(daysUntilDue, status) {
  if (status !== 'not_submitted') return null;
  if (daysUntilDue < 0) return { text: 'Overdue', tone: 'danger' };
  if (daysUntilDue === 0) return { text: 'Due today', tone: 'warning' };
  if (daysUntilDue === 1) return { text: 'Due tomorrow', tone: 'warning' };
  if (daysUntilDue <= 3) return { text: `Due in ${daysUntilDue} days`, tone: 'warning' };
  return null;
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function UrgencyBadge({ daysUntilDue, status }) {
  const u = urgency(daysUntilDue, status);
  if (!u) return null;
  const cls = u.tone === 'danger' ? 'text-danger-text' : 'text-warning-text';
  return <p className={`text-xs font-semibold mt-0.5 ${cls}`}>{u.text}</p>;
}

function ActionIcons({ assignment, onView, onSubmit, onCertificate }) {
  const hasSubmission = assignment.status !== 'not_submitted';
  const showCertificate = assignment.isHackathon && assignment.status === 'approved';

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        type="button"
        onClick={() => onView(assignment._id)}
        className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        title="View details"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
      {hasSubmission ? (
        <button
          type="button"
          onClick={() => onSubmit(assignment._id)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="Edit submission"
        >
          <EditIcon className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSubmit(assignment._id)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="Submit assignment"
        >
          <UploadIcon className="w-4 h-4" />
        </button>
      )}
      {showCertificate && (
        <div className="relative group">
          <button
            type="button"
            onClick={() => onCertificate()}
            className="w-8 h-8 rounded-md flex items-center justify-center text-accent-600 hover:bg-accent-100 transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>
          <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-md bg-neutral-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Download certificate
          </span>
        </div>
      )}
    </div>
  );
}

export default function AssignmentPage() {
  const { courseId } = useParams();
  const [page, setPage] = useState(1);
  const [infoModalId, setInfoModalId] = useState(null);
  const [submitModalId, setSubmitModalId] = useState(null);
  const [toast, setToast] = useState(null);

  // Switching courses re-renders this page with a new courseId without
  // remounting it — reset to page 1 so we don't strand the student on a
  // page number that doesn't exist for the new course's assignment count.
  useEffect(() => {
    setPage(1);
  }, [courseId]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['assignment', 'summary', courseId],
    queryFn: () => getAssignmentSummary(courseId),
  });

  const {
    data: assignments,
    isLoading: listLoading,
    isError: listError,
    refetch,
  } = useQuery({
    queryKey: ['assignment', 'list', courseId],
    queryFn: () => getAssignments(courseId),
  });

  const totalPages = assignments ? Math.max(1, Math.ceil(assignments.length / PAGE_SIZE)) : 1;
  const pageItems = assignments ? assignments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  function handleCertificateClick() {
    setToast({
      icon: '🏆',
      title: 'Coming soon',
      message: 'Verifiable certificate downloads are on the way.',
    });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total" value={summary.total} />
            <StatCard label="Submitted" value={summary.submitted} tone="warning" />
            <StatCard label="Approved" value={summary.approved} tone="success" />
            <StatCard label="Not Approved" value={summary.notApproved} tone="danger" />
          </>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Assignments</h3>
        </div>

        {listLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : listError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load assignments.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No assignments yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="sm:hidden flex flex-col divide-y divide-neutral-100">
              {pageItems.map((a) => (
                <div key={a._id} className={`p-4 flex flex-col gap-2 ${a.isHackathon ? 'bg-purple-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{a.title}</p>
                      {a.isHackathon && (
                        <span className="inline-block mt-1 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700">
                          Hackathon
                        </span>
                      )}
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500">Due {formatDate(a.dueDate)}</p>
                      <UrgencyBadge daysUntilDue={a.daysUntilDue} status={a.status} />
                      {a.grade && <p className="text-xs font-semibold text-neutral-700 mt-0.5">Grade: {a.grade}</p>}
                    </div>
                    <ActionIcons
                      assignment={a}
                      onView={setInfoModalId}
                      onSubmit={setSubmitModalId}
                      onCertificate={handleCertificateClick}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet/desktop: table, horizontally scrollable if the viewport is tight */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="flex items-center gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-50 border-b border-neutral-100">
                  <span className="flex-1">Assignment</span>
                  <span className="w-36 shrink-0">Due Date</span>
                  <span className="w-32 shrink-0">Status</span>
                  <span className="w-28 shrink-0 text-right">Action</span>
                </div>
                {pageItems.map((a) => (
                  <div
                    key={a._id}
                    className={`flex items-center gap-4 px-5 py-4 border-b border-neutral-100 last:border-b-0 text-sm ${
                      a.isHackathon ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate">{a.title}</p>
                      {a.isHackathon && (
                        <span className="inline-block mt-1 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700">
                          Hackathon
                        </span>
                      )}
                      {a.grade && <p className="text-xs font-semibold text-neutral-500 mt-0.5">Grade: {a.grade}</p>}
                    </div>
                    <div className="w-36 shrink-0">
                      <p className="text-neutral-500">{formatDate(a.dueDate)}</p>
                      <UrgencyBadge daysUntilDue={a.daysUntilDue} status={a.status} />
                    </div>
                    <div className="w-32 shrink-0">
                      <StatusPill status={a.status} />
                    </div>
                    <div className="w-28 shrink-0">
                      <ActionIcons
                        assignment={a}
                        onView={setInfoModalId}
                        onSubmit={setSubmitModalId}
                        onCertificate={handleCertificateClick}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md px-3 py-1.5 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AssignmentInfoModal courseId={courseId} assignmentId={infoModalId} onClose={() => setInfoModalId(null)} />
      <SubmitAssignmentModal courseId={courseId} assignmentId={submitModalId} onClose={() => setSubmitModalId(null)} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
