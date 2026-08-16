import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const EMPTY = {
  fullName: '',
  cnic: '',
  referenceNumber: '',
  program: '',
  batch: '',
  campus: '',
  cardId: '',
  validUntil: '',
  status: 'active',
};

const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600';
const inputClass = 'w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none transition-colors focus:border-primary-800';

const StudentIdCardForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    axios
      .get(`${API_URL}/api/admin/id-cards/${id}`, { withCredentials: true })
      .then((res) => {
        const c = res.data.card;
        setForm({
          fullName: c.fullName || '',
          cnic: c.cnic || '',
          referenceNumber: c.referenceNumber || '',
          program: c.program || '',
          batch: c.batch || '',
          campus: c.campus || '',
          cardId: c.cardId || '',
          validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
          status: c.status || 'active',
        });
      })
      .catch(() => setError('Failed to load ID card.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = { ...form };
    if (!isEdit && !payload.cardId.trim()) delete payload.cardId; // let the server auto-generate one

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/api/admin/id-cards/${id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/admin/id-cards`, payload, { withCredentials: true });
      }
      navigate('/admin/id-cards');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save ID card.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><p className="text-sm text-neutral-500">Loading...</p></div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-neutral-900">{isEdit ? 'Edit Student ID Card' : 'Issue Student ID Card'}</h1>
      <p className="text-sm text-neutral-500 mt-1">Visible to the student via the public "Download ID Card" lookup.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" required value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>CNIC (13 digits)</label>
              <input type="text" required pattern="\d{13}" title="13 digits, no dashes" value={form.cnic} onChange={(e) => setField('cnic', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reference Number</label>
              <input type="text" value={form.referenceNumber} onChange={(e) => setField('referenceNumber', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Program</label>
              <input type="text" required value={form.program} onChange={(e) => setField('program', e.target.value)} className={inputClass} placeholder="Web Development" />
            </div>
            <div>
              <label className={labelClass}>Batch</label>
              <input type="text" value={form.batch} onChange={(e) => setField('batch', e.target.value)} className={inputClass} placeholder="BATCH-SKR-01" />
            </div>
            <div>
              <label className={labelClass}>Campus</label>
              <input type="text" required value={form.campus} onChange={(e) => setField('campus', e.target.value)} className={inputClass} placeholder="Saylani TITAN Sukkur Campus" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Card Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Card ID</label>
              <input type="text" value={form.cardId} onChange={(e) => setField('cardId', e.target.value)} className={inputClass} placeholder="Leave blank to auto-generate" disabled={isEdit} />
              {!isEdit && <p className="text-[11px] text-neutral-400 mt-1">Leave blank to auto-generate a unique ID.</p>}
            </div>
            <div>
              <label className={labelClass}>Valid Until</label>
              <input type="date" required value={form.validUntil} onChange={(e) => setField('validUntil', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-danger-text">{error}</p>}

        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white font-bold text-sm rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Issue Card'}
          </button>
          <button type="button" onClick={() => navigate('/admin/id-cards')} className="px-6 py-3 border border-neutral-200 text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentIdCardForm;
