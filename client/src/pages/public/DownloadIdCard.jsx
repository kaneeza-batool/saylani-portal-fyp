import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import titanLogo from '../../assets/titan-logo.png';

/* ============================================================
   TITAN — Download ID Card (/download-id-card)
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const DownloadIdCard = () => {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(() => searchParams.get('cnic') || searchParams.get('cardId') || '');
  const [status, setStatus] = useState('idle'); // idle | loading | found | not_found | error
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const runLookup = async (rawIdentifier) => {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      setError('Enter your CNIC or card ID.');
      return;
    }
    setError('');
    setStatus('loading');
    try {
      const res = await axios.get(`${API_URL}/api/id-cards/${encodeURIComponent(trimmed)}`);
      setRecord(res.data.idCard);
      setStatus('found');
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('not_found');
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runLookup(identifier);
  };

  // A scanned QR code (or a shared link) pre-fills and auto-runs the lookup
  // against our own records — genuinely functional, not a dead link.
  useEffect(() => {
    const prefill = searchParams.get('cnic') || searchParams.get('cardId');
    if (prefill) {
      // Mount-time fetch triggered by a shared/QR link — the resulting
      // setState calls are the intended effect, not an accidental cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runLookup(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'found' && record) {
      const verifyUrl = `${window.location.origin}/download-id-card?cnic=${encodeURIComponent(record.cnic)}`;
      QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: '#132345', light: '#FFFFFF' } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }
  }, [status, record]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Without this, html2canvas can capture the card before the custom
      // Sora font finishes loading, silently substituting wrong glyphs
      // (garbled name text) instead of throwing an error.
      await document.fonts.ready;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        ignoreElements: (el) => el.hasAttribute('data-card-decor'),
      });
      const link = document.createElement('a');
      link.download = `TITAN-ID-Card-${record.cardId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20 pt-16">
      <section className="relative py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 border-b border-neutral-100">
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
             style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-info-text bg-info-bg border border-info-text/30 rounded-full">
            Student Services
          </Badge>
          <h1 className="te-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
            Download Your Student ID Card
          </h1>
          <p className="te-body mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-lg mx-auto font-normal">
            Enter your CNIC or card ID to preview and download your official TITAN student ID card.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 sm:p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600">CNIC or Card ID</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-sm outline-none transition-colors focus:border-primary-800"
                  placeholder="4230112345671 or TITAN-ID-2026-XXXXXX"
                />
                {error && <p className="mt-1.5 text-xs text-danger-text">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-primary-900 text-white font-bold text-sm rounded-lg p-3 hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Looking Up...' : 'Find My Card'}
              </button>
            </form>
          </Card>

          {status === 'not_found' && (
            <Card className="mt-6 p-6 bg-neutral-50/60 border border-neutral-200 rounded-xl text-center">
              <span className="text-xl">🔍</span>
              <p className="te-body text-sm text-neutral-600 mt-2 leading-relaxed">
                No student ID card found for this ID. Cards are issued after your entry test is passed and enrollment is confirmed.
                If you believe this is an error, contact admissions.
              </p>
            </Card>
          )}

          {status === 'found' && record && (
            <div className="mt-8">
              {/* ============ VISUAL ID CARD ============ */}
              <div className="flex justify-center">
                <div
                  ref={cardRef}
                  className="relative w-[360px] h-[220px] rounded-2xl overflow-hidden shadow-xl p-5 flex flex-col justify-between"
                  style={{ background: 'linear-gradient(135deg, #132345 0%, #1D3557 55%, #202938 100%)', color: '#FFFFFF' }}
                >
                  {/* Decorative gold corner accent — inline colors throughout this card:
                      html2canvas can't parse the color-mix()/oklch() CSS that Tailwind v4's
                      gradient and opacity-modifier (e.g. bg-accent-500/20) utilities emit,
                      so every color here is a literal hex/rgba value instead of a class.
                      This blob is also excluded from the html2canvas capture below (see
                      `ignoreElements`) — CSS `filter: blur()` corrupts html2canvas's text
                      rendering wherever the blurred element overlaps other content. */}
                  <div data-card-decor className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(208, 163, 91, 0.2)', filter: 'blur(32px)' }} />
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: '2px solid rgba(208, 163, 91, 0.3)' }} />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <img src={titanLogo} alt="TITAN crest" className="h-7 w-auto" />
                      <div className="leading-none">
                        <p className="te-display text-xs font-extrabold tracking-wide">TITAN</p>
                        <p className="text-[6px] font-bold tracking-[0.15em] uppercase mt-0.5" style={{ color: '#D5B476' }}>Student ID Card</p>
                      </div>
                    </div>
                    <Badge className="te-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: '#CEA45C', color: '#132345' }}>
                      {record.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#CEA45C" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                    </div>
                    <div className="min-w-0">
                      {/* overflow-hidden + whitespace-nowrap, not `truncate` — html2canvas
                          mis-renders text-overflow:ellipsis as ghosted/doubled glyphs */}
                      <p className="text-base font-bold leading-tight overflow-hidden whitespace-nowrap" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>{record.fullName}</p>
                      <p className="text-[10px] mt-0.5 overflow-hidden whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>{record.program}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#D5B476' }}>{record.batch ? `Batch ${record.batch}` : ''} {record.campus}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div className="space-y-0.5">
                      <p className="te-mono text-[8px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Card ID</p>
                      <p className="te-mono text-[10px] font-bold">{record.cardId}</p>
                      <p className="te-mono text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Valid Until {formatDate(record.validUntil)}</p>
                    </div>
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="QR verification code" className="w-12 h-12 rounded p-0.5" style={{ backgroundColor: '#FFFFFF' }} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-7 py-3 bg-accent-600 text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloading ? 'Preparing Download...' : 'Download as Image'}
                </button>
              </div>
              <p className="text-center text-xs text-neutral-400 mt-3">
                Issued {formatDate(record.issueDate)} · Scan the QR code to re-verify this card anytime.
              </p>
            </div>
          )}
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
};

export default DownloadIdCard;
