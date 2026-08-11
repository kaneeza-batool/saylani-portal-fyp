import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { checkInTrainer, checkOutTrainer, lookupTrainerByEmployeeId } from '../../../services/trainerAttendanceService';

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function fmtTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export default function TrainersAttendanceMark() {
  const [employeeId, setEmployeeId] = useState('');
  const [trainer, setTrainer] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) return;
    setError('');
    setTrainer(null);
    setToday(null);
    setVerifying(true);
    try {
      const data = await lookupTrainerByEmployeeId(employeeId.trim());
      setTrainer(data.trainer);
      setToday(data.today);
    } catch (err) {
      setError(err.response?.data?.message || 'No trainer found with that Employee ID.');
    } finally {
      setVerifying(false);
    }
  };

  const checkInMutation = useMutation({
    mutationFn: () => checkInTrainer({ employeeId: trainer.employeeId, campus: trainer.city }),
    onSuccess: (record) => setToday(record),
    onError: (err) => setError(err.response?.data?.message || 'Check-in failed.'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutTrainer({ employeeId: trainer.employeeId }),
    onSuccess: (record) => setToday(record),
    onError: (err) => setError(err.response?.data?.message || 'Check-out failed.'),
  });

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-4 max-w-[720px]">
      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
        <div className="font-heading font-bold text-h6 text-neutral-900">Scan Trainer Card</div>
        <form onSubmit={handleVerify} className="flex gap-2.5">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Scan or enter Employee ID..."
            className="flex-1 border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors"
          />
          <button
            type="submit"
            disabled={verifying}
            className="border-none bg-gold-500 text-white text-body font-semibold px-5 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Trainer'}
          </button>
        </form>
        {error && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>}
      </div>

      {trainer && (
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h5 border border-gold-500/40">
            {initials(trainer.name)}
          </div>
          <div className="text-center">
            <div className="font-heading font-bold text-h6 text-neutral-900">{trainer.name}</div>
            <div className="text-body-sm text-neutral-400">Employee ID: {trainer.employeeId}</div>
            <div className="text-body-sm text-neutral-400">{trainer.course} · {trainer.city}</div>
          </div>

          {today?.checkIn && (
            <div className="text-caption text-neutral-600">
              Checked in at <span className="font-semibold text-neutral-900">{fmtTime(today.checkIn)}</span>
              {today.checkOut && (
                <>
                  {' '}
                  · Checked out at <span className="font-semibold text-neutral-900">{fmtTime(today.checkOut)}</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => checkInMutation.mutate()}
              disabled={!!today?.checkIn || checkInMutation.isPending}
              className="border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check In
            </button>
            <button
              type="button"
              onClick={() => checkOutMutation.mutate()}
              disabled={!today?.checkIn || !!today?.checkOut || checkOutMutation.isPending}
              className="border border-danger-200 bg-surface text-danger-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check Out
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
