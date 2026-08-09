import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { submitFeedback } from '../services/feedbackService';
import { ImageIcon } from './icons';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TYPES = [
  { key: 'bug', label: 'Bug', emoji: '🐛' },
  { key: 'idea', label: 'Idea', emoji: '💡' },
  { key: 'other', label: 'Other', emoji: '💬' },
];

function initialState() {
  return { type: 'bug', text: '', imagePreview: null, imageBase64: null, error: '', submitted: false };
}

export default function FeedbackModal({ open, onClose }) {
  const [state, setState] = useState(initialState);
  const { type, text, imagePreview, imageBase64, error, submitted } = state;

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => setState((s) => ({ ...s, submitted: true, error: '' })),
    onError: (err) => {
      setState((s) => ({ ...s, error: err.response?.data?.message || 'Failed to send feedback. Please try again.' }));
    },
  });

  function handleClose() {
    setState(initialState());
    onClose();
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setState((s) => ({ ...s, error: 'Unsupported image format. Use PNG, JPEG, or WEBP.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setState((s) => ({ ...s, error: 'Image too large (max 4MB).' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setState((s) => ({ ...s, imagePreview: reader.result, imageBase64: reader.result, error: '' }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) {
      setState((s) => ({ ...s, error: 'Please describe your feedback.' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));
    mutation.mutate({ type, text: text.trim(), imageBase64: imageBase64 || undefined });
  }

  const selectedLabel = TYPES.find((t) => t.key === type)?.label.toLowerCase();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Share Your Feedback"
      footer={
        submitted ? null : (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="feedback-form"
              disabled={mutation.isPending}
              className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Sending...' : 'Send Feedback'}
            </button>
          </>
        )
      }
    >
      {submitted ? (
        <div data-testid="feedback-success" className="flex flex-col items-center text-center gap-3 py-6">
          <span className="text-4xl">✅</span>
          <p className="font-heading text-lg font-bold text-neutral-900">Thanks for your feedback!</p>
          <p className="text-sm text-neutral-500">
            We've received your {selectedLabel} report and will take a look.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/feedback"
              onClick={handleClose}
              className="rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-primary-800 hover:bg-primary-50"
            >
              View My Feedback
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form id="feedback-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{error}</div>
          )}

          <div>
            <label className={labelClass}>What kind of feedback is this?</label>
            <div className="grid grid-cols-3 gap-2.5">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, type: t.key }))}
                  data-testid={`feedback-type-${t.key}`}
                  className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-sm font-semibold transition-colors ${
                    type === t.key
                      ? 'border-primary-800 bg-primary-50 text-primary-800'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Your Feedback*</label>
            <textarea
              value={text}
              onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
              rows={4}
              placeholder="Tell us what happened or what you'd like to see..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Attach an Image (optional)</label>
            <label className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3.5 py-3 text-sm text-neutral-500 cursor-pointer hover:border-primary-500 hover:text-primary-500">
              <ImageIcon className="w-4 h-4" />
              Choose an image to upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImagePick}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Attachment preview" className="w-20 h-20 object-cover rounded-md border border-neutral-200 mt-2" />
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
