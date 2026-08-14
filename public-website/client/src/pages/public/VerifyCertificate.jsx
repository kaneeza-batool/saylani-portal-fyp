import { useState } from 'react';

const STUDENT_PORTAL_URL_BASE = import.meta.env.VITE_STUDENT_PORTAL_URL_BASE || 'http://localhost:5273';

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = certificateId.trim();
    if (!trimmed) {
      setError('Enter a certificate ID to verify.');
      return;
    }
    setError('');
    // Student Portal already has a fully-functional public verify page —
    // this just links to it rather than duplicating its (auth-free) API
    // logic here.
    window.location.href = `${STUDENT_PORTAL_URL_BASE}/verify/${encodeURIComponent(trimmed)}`;
  };

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">Verify a Certificate</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        TITAN certificates are digitally verifiable. Enter a certificate ID below to confirm its authenticity.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 p-6 border border-neutral-200 bg-white shadow-sm text-left" style={{ borderRadius: 'var(--radius-standard)' }}>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600">Certificate ID</label>
        <input
          type="text"
          value={certificateId}
          onChange={(e) => { setCertificateId(e.target.value); setError(''); }}
          className="w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors focus:border-primary-800"
          style={{ borderRadius: 'var(--radius-standard)' }}
          placeholder="TITAN-WD-2026-00001"
        />
        {error && <p className="mt-1 text-xs text-danger-text">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 text-white p-2.5 text-sm font-semibold hover:opacity-90 transition-opacity bg-primary-800"
          style={{ borderRadius: 'var(--radius-standard)' }}
        >
          Verify
        </button>
      </form>

      <p className="mt-6 text-xs text-neutral-400">
        You'll be redirected to the Student Portal to see the verification result.
      </p>
    </div>
  );
};

export default VerifyCertificate;
