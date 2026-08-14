import { useQuery } from '@tanstack/react-query';
import Modal from './Modal';
import { getAssignmentDetail } from '../services/assignmentService';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AssignmentInfoModal({ courseId, assignmentId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['assignment', 'detail', courseId, assignmentId],
    queryFn: () => getAssignmentDetail(courseId, assignmentId),
    enabled: !!assignmentId,
  });

  const assignment = data?.assignment;
  const submission = data?.submission;

  return (
    <Modal open={!!assignmentId} onClose={onClose} title={assignment?.title || 'Assignment'}>
      {isLoading || !assignment ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 w-1/2 bg-neutral-200 rounded" />
          <div className="h-4 w-3/4 bg-neutral-200 rounded" />
          <div className="h-20 w-full bg-neutral-200 rounded" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Due Date</p>
              <p className="text-sm font-semibold text-neutral-900 mt-1">{formatDate(assignment.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Grade</p>
              <p className="text-sm font-semibold text-neutral-900 mt-1">{submission?.grade || 'Not graded yet'}</p>
            </div>
          </div>

          {assignment.referenceLinks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Reference Links</p>
              <ul className="flex flex-col gap-1">
                {assignment.referenceLinks.map((link) => (
                  <li key={link}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-500 hover:underline break-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Description</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{assignment.description}</p>
          </div>

          {submission?.trainerRemarks && (
            <div className="rounded-md bg-info-bg px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-info-text mb-1">Trainer Feedback</p>
              <p className="text-sm text-info-text">{submission.trainerRemarks}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
