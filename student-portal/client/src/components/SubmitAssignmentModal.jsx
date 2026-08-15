import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { getAssignmentDetail, submitAssignment } from '../services/assignmentService';
import { ImageIcon } from './icons';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SubmitAssignmentModal({ assignmentId, onClose }) {
  const queryClient = useQueryClient();
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', 'detail', assignmentId],
    queryFn: () => getAssignmentDetail(assignmentId),
    enabled: !!assignmentId,
  });

  const assignment = data?.assignment;
  const submission = data?.submission;

  useEffect(() => {
    if (submission) {
      setSubmissionLink(submission.submissionLink || '');
      setSubmissionText(submission.submissionText || '');
    } else {
      setSubmissionLink('');
      setSubmissionText('');
    }
    setImagePreviews([]);
    setError('');
  }, [submission, assignmentId]);

  const mutation = useMutation({
    mutationFn: (payload) => submitAssignment(assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    },
  });

  function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    setImagePreviews(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!submissionLink.trim() || !submissionText.trim()) {
      setError('Submission link and submission text are required.');
      return;
    }
    mutation.mutate({ submissionLink: submissionLink.trim(), submissionText: submissionText.trim(), referenceImages: [] });
  }

  return (
    <Modal
      open={!!assignmentId}
      onClose={onClose}
      title={submission ? 'Edit Submission' : 'Submit Assignment'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="submit-assignment-form"
            disabled={mutation.isPending}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-10 w-full bg-neutral-200 rounded" />
          <div className="h-24 w-full bg-neutral-200 rounded" />
        </div>
      ) : (
        <form id="submit-assignment-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {assignment?.title && <p className="text-sm text-neutral-500">For: {assignment.title}</p>}

          {error && (
            <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{error}</div>
          )}

          {submission?.lastEditedAt && (
            <p className="text-xs text-neutral-400">Last edited: {formatTimestamp(submission.lastEditedAt)}</p>
          )}

          <div>
            <label className={labelClass}>Submission Link*</label>
            <input
              type="text"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="Google Drive, GitHub, or YouTube link"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Reference Images</label>
            <label className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3.5 py-3 text-sm text-neutral-500 cursor-pointer hover:border-primary-500 hover:text-primary-500">
              <ImageIcon className="w-4 h-4" />
              Choose images to upload
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imagePreviews.map((img) => (
                  <img
                    key={img.url}
                    src={img.url}
                    alt={img.name}
                    className="w-16 h-16 object-cover rounded-md border border-neutral-200"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Submission Text*</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe what you built, any tradeoffs, or notes for your trainer"
              rows={4}
              className={inputClass}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
