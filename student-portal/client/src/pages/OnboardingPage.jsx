import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import logo from '/images/logo/titan-logo-clean.png';
import { uploadAvatar } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { CameraIcon } from '../components/icons';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { student, refreshStudent } = useAuth();
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async () => {
      await refreshStudent();
      navigate('/courses');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to upload. Please try again.');
    },
  });

  function handlePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Unsupported image format. Use PNG, JPEG, or WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image too large (max 4MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setImageBase64(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function handleContinue() {
    if (!imageBase64) return;
    mutation.mutate(imageBase64);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center gap-2"
      >
        <img src={logo} alt="TITAN" className="w-16 h-16 object-contain" />
        <h1 className="font-heading text-xl font-bold text-primary-800">Student Portal</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-card p-8 flex flex-col items-center gap-5 text-center"
      >
        <div>
          <h2 className="font-heading text-lg font-bold text-neutral-900">
            Welcome{student?.fullName ? `, ${student.fullName.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Please upload a profile picture to continue.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload profile picture"
          className="relative w-28 h-28 rounded-full border-2 border-dashed border-neutral-300 hover:border-primary-500 flex items-center justify-center overflow-hidden transition-colors shrink-0"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <CameraIcon className="w-8 h-8 text-neutral-400" />
          )}
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handlePick}
          className="hidden"
          data-testid="onboarding-avatar-input"
        />

        {error && (
          <div className="w-full rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">
            {error}
          </div>
        )}

        <motion.button
          whileTap={!imageBase64 || mutation.isPending ? undefined : { scale: 0.97 }}
          type="button"
          onClick={handleContinue}
          disabled={!imageBase64 || mutation.isPending}
          className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Uploading...' : 'Continue'}
        </motion.button>
      </motion.div>
    </div>
  );
}
