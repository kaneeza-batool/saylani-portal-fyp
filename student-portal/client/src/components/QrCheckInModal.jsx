import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { selfMarkAttendance } from '../services/attendanceRequestService';

const SCANNER_ELEMENT_ID = 'qr-checkin-scanner';

// Scans the student's own ID card QR (the exact same payload
// StudentIdCardModal generates — {org:'TITAN', type:'Student', id, name})
// via the device camera, checks it matches the logged-in student, then
// marks today's attendance. Camera access/decoding via html5-qrcode; if the
// camera won't start or the scan can't be read, the parent card's
// "Request Instead" flow is the fallback — this modal never silently marks
// anyone present without a successful, matching scan.
export default function QrCheckInModal({ open, onClose, student, onMarked }) {
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  const markMutation = useMutation({
    mutationFn: selfMarkAttendance,
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      onMarked?.(record);
    },
    onError: (err) => {
      setScanError(err.response?.data?.message || 'Could not mark attendance after scanning. Please try Request Instead.');
    },
  });

  useEffect(() => {
    if (!open) return undefined;

    setCameraError('');
    setScanError('');
    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    async function handleDecoded(text) {
      if (cancelled) return;
      try {
        const payload = JSON.parse(text);
        if (payload.org !== 'TITAN' || payload.type !== 'Student') {
          setScanError('That QR code is not a TITAN student ID. Try again or use Request Instead.');
          return;
        }
        if (String(payload.id) !== String(student?.rollNumber)) {
          setScanError("That QR code doesn't match your own ID card. Scan your own card, or use Request Instead.");
          return;
        }
        setScanError('');
        cancelled = true;
        await scanner.stop().catch(() => {});
        markMutation.mutate();
      } catch {
        setScanError("Couldn't read that as a TITAN ID QR code. Try again or use Request Instead.");
      }
    }

    setScanning(true);
    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, handleDecoded, () => {})
      .catch((err) => {
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera access, or use Request Instead.'
            : "Couldn't access a camera on this device. Use Request Instead."
        );
        setScanning(false);
      });

    return () => {
      cancelled = true;
      setScanning(false);
      scanner.stop().catch(() => {});
      scanner.clear().catch(() => {});
    };
  }, [open, student?.rollNumber]);

  function handleClose() {
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Scan Your ID QR"
      footer={
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Cancel
        </button>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-neutral-500 text-center">
          Point your camera at your own TITAN ID card QR code to check in for today.
        </p>

        <div
          id={SCANNER_ELEMENT_ID}
          className="w-full max-w-[280px] aspect-square rounded-lg overflow-hidden bg-neutral-900"
        />

        {markMutation.isPending && <p className="text-sm font-semibold text-primary-800">Marking your attendance...</p>}
        {cameraError && (
          <div className="w-full rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5 text-center">
            {cameraError}
          </div>
        )}
        {scanError && !cameraError && (
          <div className="w-full rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5 text-center">
            {scanError}
          </div>
        )}
        {scanning && !cameraError && !scanError && !markMutation.isPending && (
          <p className="text-xs text-neutral-400">Waiting for a QR code...</p>
        )}
      </div>
    </Modal>
  );
}
