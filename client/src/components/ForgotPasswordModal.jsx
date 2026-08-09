import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { forgotPassword } from '../services/authService';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

export default function ForgotPasswordModal({ open, onClose }) {
  const [cnic, setCnic] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => forgotPassword(cnic),
    onSuccess: () => setSubmitted(true),
  });

  function handleClose() {
    setCnic('');
    setSubmitted(false);
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!cnic.trim()) return;
    mutation.mutate();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Forgot Password">
      {submitted ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <span className="text-4xl">📧</span>
          <p className="font-heading text-lg font-bold text-neutral-900">Check your email</p>
          <p className="text-sm text-neutral-500">
            If an account exists for that CNIC, a password reset link has been sent to the email on file. The link
            expires in 30 minutes.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">
            Enter your CNIC and we'll send a password reset link to the email on file for your account.
          </p>
          <div>
            <label className={labelClass}>CNIC</label>
            <input
              type="text"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="4550476281307"
              className={inputClass}
              data-testid="forgot-password-cnic"
              required
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            data-testid="forgot-password-submit"
            className="w-full rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </Modal>
  );
}
