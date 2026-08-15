import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicJob, submitApplication } from '../../services/publicJobService';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const EMPTY_FORM = { fullName: '', email: '', phone: '', address: '', education: '', experience: '', skills: '' };

const inputClass =
  'border border-neutral-200 bg-surface rounded px-3 py-[10px] text-body-sm font-sans text-neutral-900 outline-none focus:border-gold-500 transition-colors';
const labelClass = 'text-caption font-semibold text-neutral-600';

export default function JobApplyPage() {
  const { id } = useParams();
  const { data: job, isLoading: jobLoading } = useQuery({ queryKey: ['public-job', id], queryFn: () => fetchPublicJob(id) });

  const [form, setForm] = useState(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const applyMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (resumeFile) fd.append('resume', resumeFile);
      if (photoFile) fd.append('photo', photoFile);
      return submitApplication(id, fd);
    },
    onError: (err) => setError(err.response?.data?.message || 'Something went wrong submitting your application.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!resumeFile) {
      setError('Please attach your resume/CV.');
      return;
    }
    applyMutation.mutate();
  };

  if (applyMutation.isSuccess) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl p-10 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-success-bg text-success-text flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="font-heading font-bold text-h5 text-neutral-900">Application submitted!</div>
        <p className="text-body-sm text-neutral-500 max-w-[420px]">
          Thanks for applying to <strong>{job?.title}</strong> at TITAN. Our team will review your application and reach out if there's a match.
        </p>
        <Link to="/careers" className="mt-2 text-body-sm font-semibold text-gold-600 hover:underline">
          Back to all openings
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5 max-w-[640px]">
      <Link to={`/careers/${id}`} className="text-caption font-semibold text-neutral-500 hover:text-gold-600 transition-colors w-fit">
        &larr; Back to job details
      </Link>

      <div>
        <h1 className="font-heading font-bold text-h4 text-navy-900">Apply{job ? ` — ${job.title}` : ''}</h1>
        {!jobLoading && job && <p className="text-body-sm text-neutral-500 mt-1">{job.company}</p>}
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-neutral-200 rounded-xl p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="fullName">Full name</label>
            <input id="fullName" type="text" required value={form.fullName} onChange={setField('fullName')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={setField('email')} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="phone">Phone</label>
            <input id="phone" type="tel" required value={form.phone} onChange={setField('phone')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="address">Address</label>
            <input id="address" type="text" value={form.address} onChange={setField('address')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="education">Education</label>
          <textarea id="education" required rows={2} value={form.education} onChange={setField('education')} placeholder="e.g. BS Computer Science, TAJ Institute (2022–2026)" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="experience">Work experience</label>
          <textarea id="experience" rows={3} value={form.experience} onChange={setField('experience')} placeholder="Relevant internships or jobs, if any" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="skills">Skills</label>
          <textarea id="skills" rows={2} value={form.skills} onChange={setField('skills')} placeholder="e.g. React, Node.js, Networking, Communication" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="resume">Resume / CV (PDF or Word, required)</label>
            <input
              id="resume"
              type="file"
              required
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} py-[7px]`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="photo">Passport-size photo (optional)</label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} py-[7px]`}
            />
          </div>
        </div>

        {error && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>}

        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="mt-1 border-none bg-gold-500 text-white text-body font-semibold px-5 py-[11px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </motion.div>
  );
}
