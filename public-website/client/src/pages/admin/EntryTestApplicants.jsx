import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const STATUS_STYLE = {
  not_scheduled: 'text-neutral-400 bg-neutral-100 border-neutral-200',
  scheduled: 'text-info-text bg-info-bg border-info-text/20',
  completed: 'text-success-text bg-success-bg border-success-text/20',
};

const EntryTestApplicants = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/entry-test`, { withCredentials: true });
      setApplicants(res.data.applicants);
    } catch {
      setError('Failed to load entry test applicants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (applicant) => {
    setActionError('');
    if (!window.confirm(`Delete the entry test record for "${applicant.fullName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/entry-test/${applicant._id}`, { withCredentials: true });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete applicant.');
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Entry Test Applicants</h1>
          <p className="text-sm text-neutral-500 mt-1">{applicants.length} record{applicants.length === 1 ? '' : 's'} — visible to applicants via "Check Entry Test Status"</p>
        </div>
        <Link to="/admin/entry-test/new" className="px-5 py-2.5 bg-accent-600 text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all no-underline">
          + Add Applicant
        </Link>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-danger-text">{error}</p>}
      {actionError && <p className="text-sm text-danger-text mb-4">{actionError}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Applicant</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">CNIC</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Program</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Test Status</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Result</th>
                <th className="text-right px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400 text-sm">No entry test records yet.</td></tr>
              )}
              {applicants.map((a) => (
                <tr key={a._id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                  <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">{a.fullName}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap te-mono text-xs">{a.cnic}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{a.selectedProgram}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_STYLE[a.testStatus]}`}>
                      {a.testStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap capitalize">{a.testResult}{a.score != null ? ` (${a.score})` : ''}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/admin/entry-test/${a._id}/edit`} className="text-primary-800 font-bold text-xs hover:underline mr-4">Edit</Link>
                    <button type="button" onClick={() => handleDelete(a)} className="text-danger-text font-bold text-xs hover:underline bg-transparent border-none px-1.5 py-1 cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EntryTestApplicants;
