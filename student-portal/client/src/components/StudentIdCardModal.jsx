import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

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

// Visually matches the Super Admin / Sub-Admin ID card exactly (see
// client/src/components/IDCardModal.jsx in the main app) — same layout, same
// qrcode.react payload shape, same "Include photo" toggle + html2canvas
// download — just built standalone here since student-portal is a separate
// app/build and can't import a component from the main client directly.
export default function StudentIdCardModal({ open, onClose, student }) {
  const cardRef = useRef(null);
  const [showPhoto, setShowPhoto] = useState(true);
  const [downloading, setDownloading] = useState(false);

  if (!student) return null;

  const hasPhoto = Boolean(student.avatarUrl);
  const qrValue = JSON.stringify({ org: 'TITAN', type: 'Student', id: student.rollNumber, name: student.fullName });

  async function downloadAsImage() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await document.fonts?.ready;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `TITAN-ID-Card-${student.rollNumber || student.fullName || 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-5"
          >
            <div
              ref={cardRef}
              className="w-[320px] max-w-[85vw] rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#ffffff', border: '1px solid #e7eae6' }}
            >
              <div className="px-5 pt-5 pb-4 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg,#0D1935,#12234A)' }}>
                <img src="/images/logo/titan-logo-clean.png" alt="TITAN" className="w-9 h-9 object-contain" />
                <div>
                  <div className="text-white font-bold text-[13px] leading-tight">TITAN</div>
                  <div className="text-[9px] leading-tight" style={{ color: '#C9A227' }}>
                    Taj Institute of Technology &amp; Applied Networks
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 px-5 py-6">
                {showPhoto && student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.fullName}
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ border: '2px solid #C9A227' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl"
                    style={{ background: '#12234A', color: '#C9A227', border: '2px solid #C9A227' }}
                  >
                    {initials(student.fullName)}
                  </div>
                )}
                <div className="text-center">
                  <div className="font-bold text-sm text-neutral-900">{student.fullName}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#C9A227' }}>
                    Student
                  </div>
                </div>

                <div className="w-full border-t border-neutral-100 pt-3 flex flex-col gap-1 items-center text-center">
                  <div className="text-xs text-neutral-600">
                    Roll No.: <span className="font-semibold text-neutral-900">{student.rollNumber ?? '—'}</span>
                  </div>
                  {student.course && <div className="text-xs text-neutral-400">{student.course}</div>}
                  {student.campus && <div className="text-xs text-neutral-400">{student.campus}</div>}
                </div>

                <div className="p-2 bg-white rounded-lg border border-neutral-100 mt-1">
                  <QRCodeSVG value={qrValue} size={96} fgColor="#12234A" level="M" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              {hasPhoto && (
                <label className="flex items-center gap-2 text-xs text-neutral-500 font-medium cursor-pointer select-none">
                  <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="cursor-pointer" />
                  Include photo
                </label>
              )}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={downloadAsImage}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {downloading ? 'Preparing...' : 'Download as Image'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2.5 text-sm font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
