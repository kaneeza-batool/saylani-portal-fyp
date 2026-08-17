import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { scanAttendance } from '../../../services/attendanceScanService';

const SCANNER_ELEMENT_ID = 'admin-attendance-qr-scanner';

// The single place Student and Trainer attendance gets marked now — Super
// Admin and Sub-Admin both use this exact page (reused verbatim, same
// pattern as MarkAttendance.jsx/MultiAttendance.jsx below already being
// shared with the sub-admin portal, backend enforces campus scope). Trainer
// Portal and Student Portal no longer mark attendance directly at all; they
// keep only their existing request/dispute flows as the fallback for when
// this scanner isn't available.
//
// One camera feed, no course/date picker — the scanned card's own type
// (Student/Trainer) and the server's campus scoping do all the routing;
// "today" is the only date this ever marks, matching how a real entrance
// scanner works.
const ACTION_LABEL = {
  marked_present: (name) => `${name} marked present`,
  already_marked: (name) => `${name} — already marked today`,
  checked_in: (name) => `${name} checked in`,
  checked_out: (name) => `${name} checked out`,
};

const ACTION_TONE = {
  marked_present: 'bg-success-bg text-success-text border-success-text/20',
  checked_in: 'bg-success-bg text-success-text border-success-text/20',
  checked_out: 'bg-info-bg text-info-text border-info-text/20',
  already_marked: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  error: 'bg-danger-50 text-danger-600 border-danger-200',
};

function ResultRow({ result }) {
  const tone = ACTION_TONE[result.action] ?? ACTION_TONE.error;
  const label = result.error ? result.error : (ACTION_LABEL[result.action]?.(result.name) ?? `${result.name} — ${result.action}`);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-body-sm font-semibold ${tone}`}
    >
      <span className="truncate">{label}</span>
      <span className="text-badge font-normal shrink-0 opacity-70">
        {result.type} · {result.time}
      </span>
    </motion.div>
  );
}

export default function ScanAttendance() {
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual'
  const [manualType, setManualType] = useState('Student');
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [marking, setMarking] = useState(false);
  const [results, setResults] = useState([]);

  async function handleScan(payload) {
    setMarking(true);
    try {
      const res = await scanAttendance(payload);
      setResults((prev) => [{ ...res, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    } catch (err) {
      setResults((prev) =>
        [
          {
            action: 'error',
            type: payload.type,
            name: payload.name || payload.id,
            error: err.response?.data?.message || 'Could not mark attendance.',
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 20)
      );
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => {
    if (mode !== 'scan') return undefined;

    setCameraError('');
    let cancelled = false;
    let hasStarted = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);

    async function handleDecoded(text) {
      if (cancelled) return;
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        return;
      }
      if (payload.org !== 'TITAN' || !payload.id) return;

      cancelled = true;
      await scanner.pause(true);
      await handleScan(payload);
      cancelled = false;
      await scanner.resume();
    }

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, handleDecoded, () => {})
      .then(() => {
        hasStarted = true;
        if (cancelled) scanner.stop().then(() => scanner.clear()).catch(() => {});
      })
      .catch((err) => {
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera access, or enter the ID manually below.'
            : "Couldn't access a camera. Enter the ID manually below instead."
        );
      });

    return () => {
      cancelled = true;
      if (!hasStarted) return;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleScan({ org: 'TITAN', type: manualType, id: manualId.trim() });
    setManualId('');
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div>
        <h1 className="font-heading font-bold text-h4 text-neutral-900">Scan Attendance</h1>
        <p className="text-body-sm text-neutral-500 mt-1">
          Scan a Student or Trainer ID card — attendance is marked automatically for today. No selection needed.
        </p>
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex-1 py-2.5 text-caption font-semibold cursor-pointer border-none bg-transparent ${
              mode === 'scan' ? 'text-gold-600 border-b-2 border-gold-500' : 'text-neutral-400'
            }`}
          >
            Scan QR
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 text-caption font-semibold cursor-pointer border-none bg-transparent ${
              mode === 'manual' ? 'text-gold-600 border-b-2 border-gold-500' : 'text-neutral-400'
            }`}
          >
            Enter ID Manually
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          {/* Always mounted (never conditionally rendered) — html5-qrcode binds
              to this element by id, and its stop()/clear() cleanup runs after
              React has already committed a mode switch, so a
              conditionally-rendered div would already be gone from the DOM by
              the time cleanup tries to touch it. */}
          <p className={`text-caption text-neutral-500 text-center ${mode === 'scan' ? '' : 'hidden'}`}>
            Point the camera at a Student or Trainer ID card.
          </p>
          <div
            id={SCANNER_ELEMENT_ID}
            className={`w-full max-w-[280px] aspect-square rounded-lg overflow-hidden bg-neutral-900 ${mode === 'scan' ? '' : 'hidden'}`}
          />
          {mode === 'scan' ? (
            cameraError && (
              <div className="w-full rounded-md bg-danger-50 text-danger-600 text-caption font-medium px-3 py-2 text-center">
                {cameraError}
              </div>
            )
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full flex flex-col gap-2.5">
              <div className="flex border border-neutral-200 rounded overflow-hidden w-fit self-center">
                {['Student', 'Trainer'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setManualType(t)}
                    className={`px-4 py-1.5 text-caption font-semibold cursor-pointer border-none transition-colors ${
                      manualType === t ? 'bg-gold-500 text-white' : 'bg-surface text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="text"
                autoFocus
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={manualType === 'Student' ? 'Enter roll number (e.g. GD-014)' : 'Enter employee ID (e.g. TRN-SUK-013)'}
                className="w-full border border-neutral-200 rounded px-3.5 py-2.5 text-body-sm text-neutral-900 outline-none focus:border-gold-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!manualId.trim() || marking}
                className="w-full border-none bg-gold-500 text-white text-body-sm font-semibold py-2.5 rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {marking ? 'Marking...' : 'Mark Attendance'}
              </button>
            </form>
          )}
          {marking && mode === 'scan' && <p className="text-caption font-semibold text-gold-600">Marking...</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline uppercase text-neutral-500">Recent scans</span>
        {results.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 text-body-sm bg-surface border border-neutral-200 rounded-xl">
            No scans yet.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {results.map((r, i) => (
              <ResultRow key={`${r.time}-${i}`} result={r} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
