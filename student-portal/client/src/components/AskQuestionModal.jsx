import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { createQuestion } from '../services/questionService';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

function initialState() {
  return { title: '', body: '', moduleTag: '', error: '' };
}

export default function AskQuestionModal({ open, onClose }) {
  const [state, setState] = useState(initialState);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => createQuestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      handleClose();
    },
    onError: (err) => {
      setState((s) => ({ ...s, error: err.response?.data?.message || 'Failed to post your question.' }));
    },
  });

  function handleClose() {
    setState(initialState());
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!state.title.trim() || !state.body.trim()) {
      setState((s) => ({ ...s, error: 'Title and details are required.' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));
    mutation.mutate({ title: state.title.trim(), body: state.body.trim(), moduleTag: state.moduleTag.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Ask a Question"
      footer={
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
            form="ask-question-form"
            disabled={mutation.isPending}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Posting...' : 'Post Question'}
          </button>
        </>
      }
    >
      <form id="ask-question-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {state.error && (
          <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{state.error}</div>
        )}

        <div>
          <label className={labelClass}>Title*</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
            placeholder="e.g. Why does my useEffect run twice?"
            className={inputClass}
            data-testid="question-title-input"
          />
        </div>

        <div>
          <label className={labelClass}>Module / Topic (optional)</label>
          <input
            type="text"
            value={state.moduleTag}
            onChange={(e) => setState((s) => ({ ...s, moduleTag: e.target.value }))}
            placeholder="e.g. React Fundamentals"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Details*</label>
          <textarea
            value={state.body}
            onChange={(e) => setState((s) => ({ ...s, body: e.target.value }))}
            rows={5}
            placeholder="Explain what you're stuck on — the more context, the better the answers."
            className={inputClass}
            data-testid="question-body-input"
          />
        </div>
      </form>
    </Modal>
  );
}
