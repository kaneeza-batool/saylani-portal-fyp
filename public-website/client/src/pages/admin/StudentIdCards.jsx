import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const StudentIdCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/id-cards`, { withCredentials: true });
      setCards(res.data.cards);
    } catch {
      setError('Failed to load ID cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (card) => {
    setActionError('');
    if (!window.confirm(`Delete ID card "${card.cardId}" for "${card.fullName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/id-cards/${card._id}`, { withCredentials: true });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete card.');
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Student ID Cards</h1>
          <p className="text-sm text-neutral-500 mt-1">{cards.length} card{cards.length === 1 ? '' : 's'} — visible to students via "Download ID Card"</p>
        </div>
        <Link to="/admin/id-cards/new" className="px-5 py-2.5 bg-accent-600 text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all no-underline">
          + Issue ID Card
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
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Card ID</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Campus</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Valid Until</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400 text-sm">No ID cards issued yet.</td></tr>
              )}
              {cards.map((c) => (
                <tr key={c._id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                  <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">{c.fullName}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap te-mono text-xs">{c.cnic}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap te-mono text-xs">{c.cardId}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{c.campus}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{new Date(c.validUntil).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${c.status === 'active' ? 'text-success-text bg-success-bg border-success-text/20' : 'text-neutral-400 bg-neutral-100 border-neutral-200'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/admin/id-cards/${c._id}/edit`} className="text-primary-800 font-bold text-xs hover:underline mr-4">Edit</Link>
                    <button type="button" onClick={() => handleDelete(c)} className="text-danger-text font-bold text-xs hover:underline bg-transparent border-none p-0 cursor-pointer">Delete</button>
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

export default StudentIdCards;
