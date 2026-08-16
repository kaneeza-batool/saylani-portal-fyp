import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getCertificateForCourse } from '../services/certificateService';
import logo from '/images/logo/titan-logo-clean.png';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { DownloadIcon, ShareIcon, CertificateIcon, CheckCircleIcon } from '../components/icons';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function StatPill({ label, value }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 flex flex-col items-center text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="font-heading text-2xl font-bold text-neutral-900 mt-1.5">{value}</p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-neutral-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-neutral-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-neutral-200 rounded-lg animate-pulse" />
      </div>
      <div className="h-96 bg-neutral-200 rounded-xl animate-pulse" />
    </div>
  );
}

export default function CertificatePage() {
  const { courseId } = useParams();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [shareState, setShareState] = useState('idle'); // idle | copied

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['certificate', 'course', courseId],
    queryFn: () => getCertificateForCourse(courseId),
  });

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      // scale: 2 ("retina") for a crisp, print-worthy export without the
      // multi-megabyte PNG that scale: 3 produces on this card's textured
      // background — the on-screen card is rendered at CSS pixel size, but
      // a downloaded certificate should still hold up above typical-monitor
      // resolution.
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${data.certificate.certificateId}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    const url = data.certificate.verifyUrl;
    const shareData = {
      title: `${data.certificate.studentName}'s TITAN Certificate`,
      text: `Verify my ${data.certificate.courseName} certificate from TITAN.`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet — nothing else to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 1800);
    } catch {
      // Clipboard API unavailable — fail silently, nothing else to do here.
    }
  }

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-neutral-500">Couldn't load your certificate.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data.eligible) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <CertificateIcon className="w-10 h-10 text-neutral-300" />
        <p className="font-heading text-lg font-bold text-neutral-900">Certificate not yet available</p>
        <p className="text-sm text-neutral-500 max-w-sm">
          You're {data.percentage}% through this course. Complete all modules to unlock your certificate of
          completion.
        </p>
        <Link
          to="/progress"
          className="mt-2 rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors"
        >
          View Progress
        </Link>
      </div>
    );
  }

  const cert = data.certificate;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        to={`/dashboard/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:text-primary-900 transition-colors self-start"
      >
        ← Back to Dashboard
      </Link>

      <div className="flex flex-col items-center text-center gap-2 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-wide bg-success-bg text-success-text">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Course Completed
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-neutral-900">Congratulations, {cert.studentName.split(' ')[0]}!</h1>
        <p className="text-sm text-neutral-500 max-w-md">
          You've completed <span className="font-semibold text-neutral-700">{cert.courseName}</span>. Your verified
          certificate is ready below.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <StatPill label="Final Grade" value={cert.finalGrade} />
        <StatPill label="Attendance" value={`${cert.attendancePercent}%`} />
        <StatPill label="Quiz Average" value={`${cert.quizAverage}%`} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
        className="flex justify-center py-2"
      >
        <div
          ref={cardRef}
          data-testid="certificate-card"
          className="relative w-full max-w-2xl overflow-hidden rounded-xl border-[3px] border-accent-500 bg-primary-900 text-white p-8 sm:p-12"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 8%, rgba(206,164,92,0.25) 0%, rgba(206,164,92,0) 45%), repeating-linear-gradient(135deg, rgba(206,164,92,0.06) 0px, rgba(206,164,92,0.06) 1px, transparent 1px, transparent 13px)',
          }}
        >
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <img src={logo} alt="TITAN" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-accent-400">
              Certificate of Completion
            </p>
          </div>

          <p className="text-center text-xs sm:text-sm text-white/50 uppercase tracking-widest">
            This certifies that
          </p>
          <h2 className="text-center font-heading text-3xl sm:text-4xl font-bold text-accent-400 my-3 break-words">
            {cert.studentName}
          </h2>
          <p className="text-center text-sm text-white/70">has successfully completed the course</p>
          <h3 className="text-center font-heading text-xl sm:text-2xl font-bold mt-1.5">{cert.courseName}</h3>

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mt-8 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Batch</p>
              <p className="text-sm font-semibold mt-0.5">{cert.batch}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Campus</p>
              <p className="text-sm font-semibold mt-0.5">{cert.campus}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Issue Date</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(cert.issueDate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Final Grade</p>
              <p className="text-sm font-semibold mt-0.5">{cert.finalGrade}</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 mt-10 sm:mt-12 pt-5 border-t border-white/10">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-white/40">Certificate ID</p>
              <p className="font-mono text-xs sm:text-sm mt-0.5 truncate">{cert.certificateId}</p>
              <p className="text-[10px] text-white/30 mt-2">Scan to verify authenticity</p>
            </div>
            {/* size/level bumped from 68px/"M" — that decoded fine in
                automated testing (verified: live render, and the
                html2canvas snapshot used for PDF export, both decode to
                the exact verifyUrl), but a real phone camera scanning a
                small on-screen code is far less forgiving than a clean
                digital crop. Bigger modules + "H" (30% redundancy)
                error correction make it reliably scannable in practice. */}
            <div className="bg-white rounded-lg p-2.5 shrink-0" data-testid="certificate-qr">
              <QRCodeCanvas value={cert.verifyUrl} size={100} fgColor="#0F1930" bgColor="#FFFFFF" level="H" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3 pb-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          data-testid="certificate-download"
          className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors disabled:opacity-60"
        >
          <DownloadIcon className="w-4 h-4" />
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          data-testid="certificate-share"
          className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 transition-colors"
        >
          <ShareIcon className="w-4 h-4" />
          {shareState === 'copied' ? 'Link copied!' : 'Share'}
        </button>
      </div>
    </div>
  );
}
