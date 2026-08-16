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
            className="flex flex-col items-center gap-5"
          >
            <div
              id="printable-id-card"
              ref={cardRef}
              className="w-[320px] max-w-[85vw] rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#ffffff', border: '1px solid #e7eae6' }}
            >
              <div className="px-5 pt-5 pb-4 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg,#0D1935,#12234A)' }}>
                <img src="/logo.png" alt="TITAN" className="w-9 h-9 object-contain" />
                <div>
                  <div className="text-white font-heading font-bold text-[13px] leading-tight">TITAN</div>
                  <div className="text-[9px] leading-tight" style={{ color: '#C9A227' }}>
                    Taj Institute of Technology &amp; Applied Networks
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 px-5 py-6">
                {showPhoto && person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ border: '2px solid #C9A227' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center font-heading font-bold text-h5"
                    style={{ background: '#12234A', color: '#C9A227', border: '2px solid #C9A227' }}
                  >
                    {initials(person.name)}
                  </div>
                )}
                <div className="text-center">
                  <div className="font-heading font-bold text-body text-neutral-900">{person.name}</div>
                  <div className="text-caption font-semibold uppercase tracking-wide" style={{ color: '#C9A227' }}>
                    {type}
                  </div>
                </div>

                <div className="w-full border-t border-neutral-100 pt-3 flex flex-col gap-1 items-center text-center">
                  <div className="text-caption text-neutral-600">
                    {type === 'Student' ? 'Roll No.' : 'Employee ID'}: <span className="font-semibold text-neutral-900">{person.idNumber}</span>
                  </div>
                  {person.line1 && <div className="text-caption text-neutral-400">{person.line1}</div>}
                  {person.line2 && <div className="text-caption text-neutral-400">{person.line2}</div>}
                </div>

                <div className="p-2 bg-white rounded-lg border border-neutral-100 mt-1">
                  <QRCodeSVG value={qrValue} size={96} fgColor="#12234A" level="M" />
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
