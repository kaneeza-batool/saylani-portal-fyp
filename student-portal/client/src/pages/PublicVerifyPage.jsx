import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { verifyCertificate } from '../services/certificateService';
import logo from '/images/logo/titan-logo-clean.png';
import { CheckCircleIcon, XCircleIcon } from '../components/icons';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const REASON_MESSAGE = {
  not_found: "We couldn't find a certificate with this ID. Double-check the link and try again.",
  tampered: 'This certificate ID exists but its data does not match its issued record. Treat it as invalid.',
  error: 'Something went wrong while verifying this certificate. Please try again shortly.',
};

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-100 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-neutral-900 text-right">{value}</span>
    </div>
  );
}

// Standalone public page — no auth, no Sidebar/TopBar. Anyone with a
// certificate link (an employer, a recruiter) needs to be able to open
// this directly, logged out, and immediately trust what it says.
export default function PublicVerifyPage() {
  const { certificateId } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null });

    verifyCertificate(certificateId)
      .then((data) => {
        if (!cancelled) setState({ status: 'done', data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'done', data: { valid: false, reason: 'error' } });
      });

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        <img src={logo} alt="TITAN" className="w-9 h-9 object-contain" />
        <div>
          <p className="font-heading font-bold text-neutral-900 leading-tight">TITAN</p>
          <p className="text-xs text-neutral-400 leading-tight">Certificate Verification</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-card overflow-hidden">
        <AnimatePresence mode="wait">
        {state.status === 'loading' ? (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-8 flex flex-col items-center gap-3 animate-pulse"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-200" />
            <div className="h-4 w-40 bg-neutral-200 rounded" />
            <div className="h-3 w-56 bg-neutral-200 rounded" />
          </motion.div>
        ) : state.data.valid ? (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            data-testid="verify-result"
            data-valid="true"
          >
            <div className="bg-success-bg px-6 py-8 flex flex-col items-center gap-2 text-center">
              <CheckCircleIcon className="w-12 h-12 text-success-text" />
              <p className="font-heading text-xl font-bold text-success-text">Verified Certificate</p>
              <p className="text-sm text-success-text/80">This certificate is authentic and issued by TITAN.</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                Certificate Details
              </p>
              <DetailRow label="Student Name" value={state.data.certificate.studentName} />
              <DetailRow label="Course" value={state.data.certificate.courseName} />
              <DetailRow label="Final Grade" value={state.data.certificate.finalGrade} />
              <DetailRow label="Attendance" value={`${state.data.certificate.attendancePercent}%`} />
              <DetailRow label="Quiz Average" value={`${state.data.certificate.quizAverage}%`} />
              <DetailRow label="Issue Date" value={formatDate(state.data.certificate.issueDate)} />
              <DetailRow label="Certificate ID" value={state.data.certificate.certificateId} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            data-testid="verify-result"
            data-valid="false"
          >
            <div className="bg-danger-bg px-6 py-8 flex flex-col items-center gap-2 text-center">
              <XCircleIcon className="w-12 h-12 text-danger-text" />
              <p className="font-heading text-xl font-bold text-danger-text">
                {state.data.reason === 'not_found' ? 'Certificate Not Found' : 'Invalid Certificate'}
              </p>
              <p className="text-sm text-danger-text/80 max-w-xs">
                {REASON_MESSAGE[state.data.reason] || REASON_MESSAGE.error}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs text-neutral-400 text-center">
                ID checked: <span className="font-mono text-neutral-600">{certificateId}</span>
              </p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-neutral-400 mt-6 text-center max-w-sm">
        This is an automated verification page. Each certificate is checked against a tamper-evident hash generated
        at issuance.
      </p>
    </div>
  );
}
