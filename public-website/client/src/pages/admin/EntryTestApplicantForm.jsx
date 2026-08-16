import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const EMPTY = {
  fullName: '',
  cnic: '',
  referenceNumber: '',
  selectedProgram: '',
  testStatus: 'not_scheduled',
  testDate: '',
  testCenter: '',
  testResult: 'pending',
  score: '',
};

const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600';
const inputClass = 'w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none transition-colors focus:border-primary-800';

const EntryTestApplicantForm = () => {
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
      .get(`${API_URL}/api/admin/entry-test/${id}`, { withCredentials: true })
      .then((res) => {
        const a = res.data.applicant;
        setForm({
          fullName: a.fullName || '',
          cnic: a.cnic || '',
          referenceNumber: a.referenceNumber || '',
          selectedProgram: a.selectedProgram || '',
          testStatus: a.testStatus || 'not_scheduled',
          testDate: a.testDate ? a.testDate.slice(0, 10) : '',
          testCenter: a.testCenter || '',
          testResult: a.testResult || 'pending',
          score: a.score ?? '',
        });
      })
      .catch(() => setError('Failed to load applicant.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = { ...form, score: form.score === '' ? undefined : Number(form.score), testDate: form.testDate || undefined };

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/api/admin/entry-test/${id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/admin/entry-test`, payload, { withCredentials: true });
      }
      navigate('/admin/entry-test');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save applicant.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><p className="text-sm text-neutral-500">Loading...</p></div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-neutral-900">{isEdit ? 'Edit Entry Test Record' : 'Add Entry Test Record'}</h1>
      <p className="text-sm text-neutral-500 mt-1">Visible to the applicant via the public "Check Entry Test Status" lookup.</p>

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
              <input type="text" required value={form.referenceNumber} onChange={(e) => setField('referenceNumber', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Selected Program</label>
              <input type="text" required value={form.selectedProgram} onChange={(e) => setField('selectedProgram', e.target.value)} className={inputClass} placeholder="Web Development" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Test Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Test Status</label>
              <select value={form.testStatus} onChange={(e) => setField('testStatus', e.target.value)} className={inputClass}>
                <option value="not_scheduled">Not Scheduled</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Test Date</label>
              <input type="date" value={form.testDate} onChange={(e) => setField('testDate', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Test Center</label>
              <input type="text" value={form.testCenter} onChange={(e) => setField('testCenter', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Result</label>
              <select value={form.testResult} onChange={(e) => setField('testResult', e.target.value)} className={inputClass}>
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Score (0-100)</label>
              <input type="number" min="0" max="100" value={form.score} onChange={(e) => setField('score', e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-danger-text">{error}</p>}

        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white font-bold text-sm rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Record'}
          </button>
          <button type="button" onClick={() => navigate('/admin/entry-test')} className="px-6 py-3 border border-neutral-200 text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryTestApplicantForm;
