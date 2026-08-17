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
// background. Every color inside #printable-id-card below is a fixed hex
// for exactly this reason.
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

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   type: 'Student' | 'Trainer',
 *   person: { name: string, idNumber: string, line1?: string, line2?: string, photo?: string } | null,
 * }} props
 */
export default function IDCardModal({ open, onClose, type, person }) {
  const cardRef = useRef(null);
  const [showPhoto, setShowPhoto] = useState(true);
  const [downloading, setDownloading] = useState(false);

  if (!person) return null;

  const qrValue = JSON.stringify({ org: 'TITAN', type, id: person.idNumber, name: person.name });
  const hasPhoto = Boolean(person.photo);

  async function downloadAsImage() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Wait for web fonts to actually be painted first — html2canvas
      // rasterizes whatever's on screen at call time, and a font swap
      // mid-capture is a common source of a blank/serif-substituted name.
      await document.fonts?.ready;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `TITAN-ID-Card-${(person.idNumber || person.name || 'card').toString().replace(/\s+/g, '-')}.png`;
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
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6"
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
                wearable ID, not part of the printable/downloadable card
                itself (cardRef only wraps the card below it). */}
            <div className="flex flex-col items-center no-print">
              <div className="w-10 h-4 rounded-t-sm" style={{ background: '#CEA45C' }} />
              <div className="w-16 h-5 rounded-md -mt-1 shadow-sm flex items-center justify-center" style={{ background: '#D9DBDE' }}>
                <div className="w-6 h-1.5 rounded-full" style={{ background: '#9AA0A8' }} />
              </div>
            </div>

            <div
              id="printable-id-card"
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
                  the card's signature shape, echoing the organic accent block
                  on the reference badge template (there in teal) recolored to
                  TITAN's navy/gold instead of copied wholesale. The photo
                  overlaps its lower edge, same as the reference. */}
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
                <img src="/logo.png" alt="TITAN" className="w-11 h-11 object-contain drop-shadow-sm shrink-0" />
                <div>
                  <div className="text-white font-heading font-bold text-[17px] leading-tight tracking-[0.08em]">TITAN</div>
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
                    {showPhoto && person.photo ? (
                      <img src={person.photo} alt={person.name} className="w-[104px] h-[104px] rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-[104px] h-[104px] rounded-full flex items-center justify-center font-heading font-bold text-h4"
                        style={{ background: '#132345', color: '#D5B273' }}
                      >
                        {initials(person.name)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col gap-3.5 px-6 pt-2 pb-5">
                <div className="text-center">
                  <div className="font-heading font-extrabold text-h5 tracking-tight" style={{ color: '#9F7D46' }}>
                    {person.name}
                  </div>
                  <div className="text-caption font-bold mt-1 inline-flex items-center gap-1.5 mx-auto" style={{ color: MUTED }}>
                    <span className="w-3 h-px" style={{ background: '#CEA45C' }} />
                    {type.toUpperCase()}
                    <span className="w-3 h-px" style={{ background: '#CEA45C' }} />
                  </div>
                </div>

                {/* A distinct panel for the details — separates "the data"
                    from "the portrait" visually, and gives the card a second
                    layer of depth instead of everything floating on one flat
                    white field. */}
                <div className="flex flex-col gap-2 px-3.5 py-3 rounded-xl" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
                  <DetailRow label={type === 'Student' ? 'Roll No' : 'Emp. ID'} value={person.idNumber} />
                  <DetailRow label="Course" value={person.line1} />
                  <DetailRow label={type === 'Student' ? 'Campus' : 'City'} value={person.line2} />
                </div>
              </div>

              {/* Bottom blob mirrors the top one on the opposite corner, same
                  diagonal-symmetry idea as the reference's top-left/bottom-left
                  pair — the QR sits on a white plate overlapping it, echoing
                  how the photo overlaps the top blob above. Card height is
                  unchanged from the original design — QR stays exactly where
                  it was; only the caption moved, up into the clear white
                  gap above the blob's curve instead of sitting low enough to
                  brush against it. */}
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

            <div className="flex flex-col items-center gap-2.5 no-print">
              {hasPhoto && (
                <label className="flex items-center gap-2 text-caption text-neutral-500 font-medium cursor-pointer select-none">
                  <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="cursor-pointer" />
                  Include photo
                </label>
              )}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={downloadAsImage}
                  className="border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? 'Preparing...' : 'Download as Image'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="border border-neutral-200 bg-surface text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-neutral-200 bg-surface text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100"
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
