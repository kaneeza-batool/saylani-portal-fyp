import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const STATUS_STYLE = {
  pending: 'text-neutral-400 bg-neutral-100 border-neutral-200',
  pass: 'text-success-text bg-success-bg border-success-text/20',
  fail: 'text-danger-text bg-danger-bg border-danger-text/20',
};

const AcademicResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/results`, { withCredentials: true });
      setResults(res.data.results);
    } catch {
      setError('Failed to load academic results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (result) => {
    setActionError('');
    if (!window.confirm(`Delete the result for "${result.fullName}" (${result.examName})? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/results/${result._id}`, { withCredentials: true });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete result.');
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Academic Results</h1>
          <p className="text-sm text-neutral-500 mt-1">{results.length} record{results.length === 1 ? '' : 's'} — visible to students via "Check Result"</p>
        </div>
        <Link to="/admin/results/new" className="px-5 py-2.5 bg-accent-600 text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all no-underline">
          + Add Result
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
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Student</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">CNIC</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Exam</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Score</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400 text-sm">No results published yet.</td></tr>
              )}
              {results.map((r) => (
                <tr key={r._id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                  <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">{r.fullName}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap te-mono text-xs">{r.cnic}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{r.examName}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{r.score ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_STYLE[r.resultStatus]}`}>{r.resultStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/admin/results/${r._id}/edit`} className="text-primary-800 font-bold text-xs hover:underline mr-4">Edit</Link>
                    <button type="button" onClick={() => handleDelete(r)} className="text-danger-text font-bold text-xs hover:underline bg-transparent border-none px-1.5 py-1 cursor-pointer">Delete</button>
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

export default AcademicResults;
