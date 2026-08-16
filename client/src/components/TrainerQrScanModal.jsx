import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { markAttendanceByRollNumber } from '../services/trainerDashboardService';

const SCANNER_ELEMENT_ID = 'trainer-qr-scanner';

// Trainer-side counterpart to the student's own self-check-in QR scan (see
// student-portal/src/components/QrCheckInModal.jsx) — same QR payload
// (StudentIdCardModal's {org:'TITAN', type:'Student', id, name}), except
// here the TRAINER points the camera at a STUDENT's ID card to mark that
// one student present, one scan at a time, without needing the full
// roster checklist. Manual roll-number entry is the fallback for when the
// camera isn't available or a card won't scan — same "scan or type" duality
// as the Super Admin kiosk's own Mark Attendance page.
export default function TrainerQrScanModal({ open, onClose, course, date, onMarked }) {
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual'
  const [manualRoll, setManualRoll] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text }
  const [marking, setMarking] = useState(false);
  const scannerRef = useRef(null);

  async function markRoll(rollNumber) {
    setMarking(true);
    setStatusMsg(null);
    try {
      const result = await markAttendanceByRollNumber({ course, date, rollNumber });
      setStatusMsg({ type: 'success', text: `${result.student.name} (Roll #${result.student.rollNumber}) marked present ✓` });
      onMarked?.(result.student);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Could not mark attendance.' });
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => {
    if (!open || mode !== 'scan') return undefined;

    setCameraError('');
    let cancelled = false;
    let hasStarted = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    async function handleDecoded(text) {
      if (cancelled) return;
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        setStatusMsg({ type: 'error', text: "That doesn't look like a TITAN ID QR code." });
        return;
      }
      if (payload.org !== 'TITAN' || payload.type !== 'Student' || !payload.id) {
        setStatusMsg({ type: 'error', text: 'That QR code is not a TITAN student ID.' });
        return;
      }
      cancelled = true;
      await scanner.pause(true);
      await markRoll(payload.id);
      cancelled = false;
      await scanner.resume();
    }

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, handleDecoded, () => {})
      .then(() => {
        hasStarted = true;
        // The mode switch (or modal close) already ran before the camera
        // finished initializing — stop it now instead of leaving it
        // running invisibly in the background.
        if (cancelled) scanner.stop().then(() => scanner.clear()).catch(() => {});
      })
      .catch((err) => {
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera access, or scan/enter the roll number manually below.'
            : "Couldn't access a camera. Enter the roll number manually below instead."
        );
      });

    return () => {
      cancelled = true;
      // .stop() before .start() has actually resolved throws synchronously
      // in html5-qrcode rather than rejecting — guarding on hasStarted (not
      // just wrapping in try/catch) avoids that path entirely, since a
      // try/catch here wouldn't reliably catch it once React treats this as
      // an unhandled effect-cleanup error either way.
      if (!hasStarted) return;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, course, date]);

  function handleClose() {
    setStatusMsg(null);
    setManualRoll('');
    setMode('scan');
    onClose();
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualRoll.trim()) return;
    markRoll(manualRoll.trim());
    setManualRoll('');
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-[340px] max-w-[90vw] bg-surface rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="font-heading font-bold text-body text-neutral-900">Mark Attendance by ID</div>
              <button type="button" onClick={handleClose} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none">
                ×
              </button>
            </div>

            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setMode('scan')}
                className={`flex-1 py-2.5 text-caption font-semibold ${mode === 'scan' ? 'text-[var(--trainer-blue)] border-b-2 border-[var(--trainer-blue)]' : 'text-neutral-400'}`}
              >
                Scan QR
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 py-2.5 text-caption font-semibold ${mode === 'manual' ? 'text-[var(--trainer-blue)] border-b-2 border-[var(--trainer-blue)]' : 'text-neutral-400'}`}
              >
                Enter Roll Number
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-3">
              {/* Always mounted (never conditionally rendered) — html5-qrcode
                  binds to this element by id, and its own stop()/clear()
                  cleanup runs after React has already committed a mode
                  switch, so a conditionally-rendered div would already be
                  gone from the DOM by the time cleanup tries to touch it. */}
              <p className={`text-caption text-neutral-500 text-center ${mode === 'scan' ? '' : 'hidden'}`}>
                Point the camera at a student's ID card QR code.
              </p>
              <div
                id={SCANNER_ELEMENT_ID}
                className={`w-full max-w-[260px] aspect-square rounded-lg overflow-hidden bg-neutral-900 ${mode === 'scan' ? '' : 'hidden'}`}
              />
              {mode === 'scan' ? (
                cameraError && (
                  <div className="w-full rounded-md bg-danger-50 text-danger-600 text-caption font-medium px-3 py-2 text-center">
                    {cameraError}
                  </div>
                )
              ) : (
                <form onSubmit={handleManualSubmit} className="w-full flex flex-col gap-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    placeholder="Scan or enter roll number"
                    className="w-full border border-neutral-200 rounded px-3.5 py-2.5 text-body-sm text-neutral-900 outline-none focus:border-[var(--trainer-blue)] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!manualRoll.trim() || marking}
                    className="w-full border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold py-2.5 rounded cursor-pointer transition-colors hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {marking ? 'Marking...' : 'Mark Present'}
                  </button>
                </form>
              )}

              {marking && mode === 'scan' && <p className="text-caption font-semibold text-[var(--trainer-blue)]">Marking...</p>}
              {statusMsg && (
                <div
                  className={`w-full rounded-md text-caption font-medium px-3 py-2 text-center ${
                    statusMsg.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-danger-50 text-danger-600'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
