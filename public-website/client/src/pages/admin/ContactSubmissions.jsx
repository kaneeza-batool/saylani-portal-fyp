import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/contact-submissions`, { withCredentials: true });
      setSubmissions(res.data.submissions);
    } catch {
      setError('Failed to load contact submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (submission) => {
    setActionError('');
    if (!window.confirm(`Delete the message from "${submission.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/contact-submissions/${submission._id}`, { withCredentials: true });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete submission.');
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-neutral-900">Contact Submissions</h1>
        <p className="text-sm text-neutral-500 mt-1">{submissions.length} message{submissions.length === 1 ? '' : 's'} from the public Contact page</p>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-danger-text">{error}</p>}
      {actionError && <p className="text-sm text-danger-text mb-4">{actionError}</p>}

      {!loading && !error && submissions.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 py-12 text-center text-sm text-neutral-400">No messages yet.</div>
      )}

      {!loading && !error && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((s) => {
            const expanded = expandedId === s._id;
            return (
              <div key={s._id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : s._id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-transparent border-none cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{s.subject}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{s.name} &lt;{s.email}&gt;</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-neutral-400 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</span>
                    <span className="text-neutral-400 text-xs">{expanded ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expanded && (
                  <div className="px-5 pb-5 border-t border-neutral-100 pt-4">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{s.message}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <a href={`mailto:${s.email}`} className="text-primary-800 font-bold text-xs hover:underline no-underline">Reply by Email</a>
                      <button type="button" onClick={() => handleDelete(s)} className="text-danger-text font-bold text-xs hover:underline bg-transparent border-none p-0 cursor-pointer">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContactSubmissions;
