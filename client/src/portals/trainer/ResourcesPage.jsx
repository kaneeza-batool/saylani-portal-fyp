import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyAttendanceCourses, getMyResources, uploadResource, deleteResource } from '../../services/trainerDashboardService';

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

function fileIcon(fileType) {
  const t = (fileType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(t)) return '🖼️';
  if (t === 'pdf') return '📕';
  if (['doc', 'docx'].includes(t)) return '📄';
  if (['ppt', 'pptx'].includes(t)) return '📊';
  if (['xls', 'xlsx'].includes(t)) return '📈';
  if (['zip'].includes(t)) return '🗂️';
  return '📎';
}

function ResourceCard({ resource, onDelete, deleting }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-surface border border-neutral-200 rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[20px] shrink-0">{fileIcon(resource.fileType)}</span>
          <div className="min-w-0">
            <div className="text-body-sm font-semibold text-neutral-900 truncate">{resource.title}</div>
            <div className="text-[11.5px] text-neutral-400 truncate">{resource.course}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(resource._id)}
          disabled={deleting}
          title="Delete"
          className="w-[26px] h-[26px] shrink-0 border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-danger-50 hover:border-danger-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
          </svg>
        </button>
      </div>

      {resource.description && <p className="text-[12.5px] text-neutral-500 line-clamp-2">{resource.description}</p>}

      <a
        href={resource.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption font-semibold text-[var(--trainer-blue)] hover:underline mt-auto pt-1 border-t border-neutral-100 truncate"
      >
        {resource.fileName}
      </a>
    </motion.div>
  );
}

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const { data: courses } = useQuery({ queryKey: ['trainer-attendance-courses'], queryFn: getMyAttendanceCourses });
  const { data: resources, isLoading } = useQuery({ queryKey: ['trainer-resources'], queryFn: getMyResources });

  const [form, setForm] = useState({ title: '', description: '', course: '', file: null });
  const [formError, setFormError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: uploadResource,
    onSuccess: () => {
      setForm({ title: '', description: '', course: form.course, file: null });
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['trainer-resources'] });
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to upload resource.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-resources'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.course || !form.file) {
      setFormError('Title, course, and a file are all required.');
      return;
    }
    uploadMutation.mutate(form);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading font-bold text-h5 text-neutral-900">Resources</h1>
        <div className="text-body-sm text-neutral-400 mt-0.5">
          Share files with students enrolled in your courses — only they'll be able to see what you upload here.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5"
      >
        {formError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-600 text-body-sm rounded px-3.5 py-2.5">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
          />
          <select
            value={form.course}
            onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
          >
            <option value="">Select course...</option>
            {courses?.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors resize-none"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
            className="text-body-sm text-neutral-600 file:mr-3 file:border-none file:bg-neutral-100 file:text-neutral-700 file:text-caption file:font-semibold file:px-3.5 file:py-2 file:rounded file:cursor-pointer"
          />
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-5 py-[10px] rounded cursor-pointer transition-colors hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[110px] bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !resources?.length ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          You haven't uploaded any resources yet.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <ResourceCard
              key={r._id}
              resource={r}
              onDelete={(id) => deleteMutation.mutate(id)}
              deleting={deleteMutation.isPending && deleteMutation.variables === r._id}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
