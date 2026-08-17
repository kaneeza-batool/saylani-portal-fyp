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

// The printable card is always a fixed white surface, regardless of the
// app's own light/dark theme toggle — so its text can never use the app's
// theme-aware `text-neutral-*` classes. Those resolve through CSS variables
// that flip to LIGHT grays in dark mode (meant for dark surfaces), which
// read as almost invisible against this card's permanently-white
// background. Every color inside the card below is a fixed hex for exactly
// this reason. Mirrors client/src/components/IDCardModal.jsx exactly.
const INK = '#16233D'; // primary reading color for values — near-navy, not gray
const MUTED = '#5B6472'; // secondary text (labels, role, captions) — fixed mid-gray, ~7:1 on white
const FAINT = '#A6ACB8'; // decorative-only (colon separators), never load-bearing text
const PANEL_BG = '#F5F6F9';
const PANEL_BORDER = '#E7E9EE';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[60px_10px_1fr] gap-0 items-baseline">
      <span className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </span>
      <span style={{ color: FAINT }}>:</span>
      <span className="text-[12.5px] font-bold truncate" style={{ color: INK }}>
        {value}
      </span>
    </div>
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
            className="flex flex-col items-center gap-4"
          >
            {/* Badge-clip chrome — purely a presentation cue that this is a
                wearable ID, not part of the printable/downloadable card. */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-4 rounded-t-sm" style={{ background: '#CEA45C' }} />
              <div className="w-16 h-5 rounded-md -mt-1 shadow-sm flex items-center justify-center" style={{ background: '#D9DBDE' }}>
                <div className="w-6 h-1.5 rounded-full" style={{ background: '#9AA0A8' }} />
              </div>
            </div>

            <div
              ref={cardRef}
              className="w-[304px] max-w-[85vw] rounded-2xl overflow-hidden shadow-2xl relative"
              style={{ background: '#ffffff', border: '1px solid #E5E7EB' }}
            >
              {/* Solid navy strip guarantees the header row always has a dark
                  background to sit on — the organic blob below is decorative
                  and its exact coverage shouldn't be something header-text
                  contrast depends on. */}
              <div className="absolute inset-x-0 top-0 h-16" style={{ background: '#132345' }} />

              {/* Asymmetric navy blob sweeping down from the top-left corner —
                  mirrors client/src/components/IDCardModal.jsx exactly, see
                  that file for the full design rationale. */}
              <svg className="absolute inset-x-0 top-0 w-full" viewBox="0 0 304 210" preserveAspectRatio="none" style={{ height: 210 }}>
                <path
                  d="M0,0 H208 C224,32 190,46 204,78 C216,106 178,116 158,146 C140,172 108,158 78,176 C48,194 34,214 0,214 Z"
                  fill="#132345"
                />
                <path
                  d="M0,0 H208 C224,32 190,46 204,78 C216,106 178,116 158,146 C140,172 108,158 78,176 C48,194 34,214 0,214 Z"
                  fill="none"
                  stroke="#CEA45C"
                  strokeWidth="3"
                  strokeDasharray="1 12"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>

              {/* Logo + wordmark as one lockup on the left, both guaranteed
                  to sit on the solid navy strip above regardless of exactly
                  where the organic blob's edge falls. */}
              <div className="relative flex items-center gap-2.5 px-5 pt-4 pb-1">
                <img src="/images/logo/titan-logo-clean.png" alt="TITAN" className="w-11 h-11 object-contain drop-shadow-sm shrink-0" />
                <div>
                  <div className="text-white font-bold text-[17px] leading-tight tracking-[0.08em]">TITAN</div>
                  <div className="text-[8px] leading-tight tracking-wide" style={{ color: '#D5B273' }}>
                    Taj Institute of Technology
                    <br />
                    &amp; Applied Networks
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center pt-9 pb-1">
                <div className="p-[3px] rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg,#E7D5AE,#CEA45C 55%,#9F7D46)' }}>
                  <div className="p-[3px] rounded-full bg-white">
                    {showPhoto && student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.fullName} className="w-[104px] h-[104px] rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-[104px] h-[104px] rounded-full flex items-center justify-center font-bold text-2xl"
                        style={{ background: '#132345', color: '#D5B273' }}
                      >
                        {initials(student.fullName)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col gap-3.5 px-6 pt-2 pb-5">
                <div className="text-center">
                  <div className="font-extrabold text-base tracking-tight" style={{ color: '#9F7D46' }}>
                    {student.fullName}
                  </div>
                  <div className="text-xs font-bold mt-1 inline-flex items-center gap-1.5 mx-auto" style={{ color: MUTED }}>
                    <span className="w-3 h-px" style={{ background: '#CEA45C' }} />
                    STUDENT
                    <span className="w-3 h-px" style={{ background: '#CEA45C' }} />
                  </div>
                </div>

                {/* A distinct panel for the details — separates "the data"
                    from "the portrait" visually, and gives the card a second
                    layer of depth instead of everything floating on one flat
                    white field. */}
                <div className="flex flex-col gap-2 px-3.5 py-3 rounded-xl" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
                  <DetailRow label="Roll No" value={student.rollNumber ?? '—'} />
                  <DetailRow label="Course" value={student.course} />
                  <DetailRow label="Campus" value={student.campus} />
                </div>
              </div>

              {/* Bottom blob mirrors the top one on the opposite corner — the
                  QR sits on a white plate overlapping it, echoing how the
                  photo overlaps the top blob above. Card height is unchanged
                  from the original design — QR stays exactly where it was;
                  only the caption moved, up into the clear white gap above
                  the blob's curve instead of sitting low enough to brush
                  against it. */}
              <div className="relative h-[86px]">
                <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 304 86" preserveAspectRatio="none" style={{ height: 86 }}>
                  <path d="M304,86 H150 C168,60 140,44 168,24 C192,8 230,18 258,4 C278,-5 290,4 304,0 Z" fill="#132345" />
                </svg>
                <div className="absolute left-6 bottom-3 p-1.5 bg-white rounded-md shadow-md">
                  <QRCodeSVG value={qrValue} size={68} fgColor="#132345" level="M" />
                </div>
                <div
                  className="absolute text-[9px] font-bold uppercase tracking-wide leading-tight"
                  style={{ color: MUTED, left: '116px', top: '-16px' }}
                >
                  Scan to mark
                  <br />
                  attendance
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
