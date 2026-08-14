import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';

/* ============================================================
   TITAN — Check Result (/check-result)
   Academic/course exam results — separate from Entry Test Status.
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const RESULT_BADGE = {
  pass: { label: 'Passed', className: 'text-success-text bg-success-bg border-success-text/20' },
  fail: { label: 'Not Cleared', className: 'text-danger-text bg-danger-bg border-danger-text/20' },
  pending: { label: 'Pending', className: 'text-warning-text bg-warning-bg border-warning-text/20' },
};

const CheckResult = () => {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | found | not_found | error
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Enter your CNIC or application reference number.');
      return;
    }
    setError('');
    setStatus('loading');
    try {
      const res = await axios.get(`${API_URL}/api/results/${encodeURIComponent(trimmed)}`);
      setRecord(res.data.result);
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
            Check Your Academic Result
          </h1>
          <p className="te-body mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-lg mx-auto font-normal">
            This looks up your <span className="font-semibold text-neutral-900">course exam / final assessment result</span> as an enrolled student,
            not your entry test outcome. Looking for that instead?{' '}
            <Link to="/entry-test-status" className="font-semibold text-primary-800 hover:text-primary-900">Check Entry Test Status →</Link>
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 sm:p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600">CNIC or Reference Number</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-sm outline-none transition-colors focus:border-primary-800"
                  placeholder="4230112345671 or TITAN-2026-XXXXXX"
                />
                {error && <p className="mt-1.5 text-xs text-danger-text">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-primary-900 text-white font-bold text-sm rounded-lg p-3 hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Checking...' : 'Check Result'}
              </button>
            </form>
          </Card>

          {status === 'not_found' && (
            <Card className="mt-6 p-6 bg-neutral-50/60 border border-neutral-200 rounded-xl text-center">
              <span className="text-xl">🔍</span>
              <p className="te-body text-sm text-neutral-600 mt-2 leading-relaxed">
                No academic result found for this ID. If you recently completed an exam, results may take up to 48 hours to appear.
                Note this page is for course results only; if you meant your entry test, check{' '}
                <Link to="/entry-test-status" className="font-semibold text-primary-800 hover:text-primary-900">Entry Test Status</Link> instead.
              </p>
            </Card>
          )}

          {status === 'found' && record && (
            <Card className="mt-6 p-6 sm:p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
              <div>
                <p className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Student</p>
                <h3 className="te-display text-lg font-bold text-neutral-900 mt-0.5">{record.fullName}</h3>
                <p className="te-body text-xs text-neutral-500 mt-0.5">{record.selectedProgram}{record.batch ? ` · Batch ${record.batch}` : ''}</p>
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Exam</span>
                  <span className="font-semibold text-neutral-900 text-right max-w-[60%]">{record.examName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Published</span>
                  <span className="font-semibold text-neutral-900">{formatDate(record.publishedDate)}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Score</p>
                  <p className="te-display text-2xl font-extrabold text-neutral-900 mt-1">
                    {record.score !== undefined && record.score !== null ? record.score : '—'}<span className="text-sm text-neutral-400 font-medium">/100</span>
                  </p>
                </div>
                <Badge className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border ${RESULT_BADGE[record.resultStatus].className}`}>
                  {RESULT_BADGE[record.resultStatus].label}
                </Badge>
              </div>

              {record.resultStatus === 'pass' && (
                <Link to="/download-id-card" className="inline-block mt-6 text-sm font-bold text-primary-800 hover:text-primary-900 no-underline">
                  Download your Student ID Card →
                </Link>
              )}
            </Card>
          )}
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
};

export default CheckResult;
