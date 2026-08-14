import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';

/* ============================================================
   TITAN — Entry Test Status (/entry-test-status)
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const STATUS_BADGE = {
  not_scheduled: { label: 'Not Yet Scheduled', className: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
  scheduled: { label: 'Scheduled', className: 'text-info-text bg-info-bg border-info-text/20' },
  completed: { label: 'Completed', className: 'text-success-text bg-success-bg border-success-text/20' },
};

const RESULT_BADGE = {
  pass: { label: 'Passed', className: 'text-success-text bg-success-bg border-success-text/20' },
  fail: { label: 'Not Cleared', className: 'text-danger-text bg-danger-bg border-danger-text/20' },
  pending: { label: 'Pending', className: 'text-warning-text bg-warning-bg border-warning-text/20' },
};

const EntryTestStatus = () => {
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
      const res = await axios.get(`${API_URL}/api/entry-test/${encodeURIComponent(trimmed)}`);
      setRecord(res.data.entryTest);
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
            Check Your Entry Test Status
          </h1>
          <p className="te-body mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-lg mx-auto font-normal">
            Enter the CNIC or application reference number you used on Enroll Now to see your entry test schedule and outcome.
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
                {status === 'loading' ? 'Checking...' : 'Check Status'}
              </button>
            </form>
          </Card>

          {status === 'not_found' && (
            <Card className="mt-6 p-6 bg-neutral-50/60 border border-neutral-200 rounded-xl text-center">
              <span className="text-xl">🔍</span>
              <p className="te-body text-sm text-neutral-600 mt-2 leading-relaxed">
                No entry test record found for this ID. If you recently applied, this may take up to 48 hours to appear.
              </p>
              <Link to="/apply" className="inline-block mt-4 text-sm font-bold text-primary-800 hover:text-primary-900 no-underline">
                Haven't applied yet? Enroll Now →
              </Link>
            </Card>
          )}

          {status === 'found' && record && (
            <Card className="mt-6 p-6 sm:p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Applicant</p>
                  <h3 className="te-display text-lg font-bold text-neutral-900 mt-0.5">{record.fullName}</h3>
                  <p className="te-body text-xs text-neutral-500 mt-0.5">{record.selectedProgram}</p>
                </div>
                <Badge className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${STATUS_BADGE[record.testStatus].className}`}>
                  {STATUS_BADGE[record.testStatus].label}
                </Badge>
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Test Date</span>
                  <span className="font-semibold text-neutral-900">{formatDate(record.testDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Test Center</span>
                  <span className="font-semibold text-neutral-900">{record.testCenter || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reference Number</span>
                  <span className="font-semibold text-neutral-900 te-mono text-xs">{record.referenceNumber}</span>
                </div>
              </div>

              {record.testStatus === 'completed' && (
                <div className="mt-5 pt-5 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <p className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Result</p>
                    <p className="te-display text-2xl font-extrabold text-neutral-900 mt-1">{record.score ?? '—'}<span className="text-sm text-neutral-400 font-medium">/100</span></p>
                  </div>
                  <Badge className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border ${RESULT_BADGE[record.testResult].className}`}>
                    {RESULT_BADGE[record.testResult].label}
                  </Badge>
                </div>
              )}

              {record.testStatus === 'completed' && record.testResult === 'pass' && (
                <Link to="/download-id-card" className="inline-block mt-6 text-sm font-bold text-primary-800 hover:text-primary-900 no-underline">
                  Passed? Download your Student ID Card →
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

export default EntryTestStatus;
