import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { CATEGORY_LABELS } from '../../data/categoryLabels';
import resolveImageUrl from '../../utils/resolveImageUrl';

/* ============================================================
   TITAN — Admin Course Form (/admin/courses/new, /admin/courses/:id/edit)
   Full form covering every Course field: basic info, curriculum modules
   (dynamic add/remove), career outcomes, tools, image upload + preview,
   and the three admin-specific toggles.
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const EMPTY_COURSE = {
  title: '',
  category: 'web',
  duration: '',
  seats: 0,
  codingRequired: false,
  languages: [],
  tools: [],
  desc: '',
  tags: '',
  roadmap: [],
  tagline: '',
  curriculum: [],
  careerOutcomes: [],
  idealFor: '',
  isActive: true,
};

const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600';
const inputClass = 'w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none transition-colors focus:border-primary-800';

// --- Reusable simple string-array field (languages, tools, roadmap, careerOutcomes) ---
const TextListField = ({ label, items, onChange, placeholder }) => {
  const updateItem = (idx, value) => {
    const next = [...items];
    next[idx] = value;
    onChange(next);
  };
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, '']);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              className={inputClass}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="shrink-0 px-3 text-danger-text font-bold text-sm border border-neutral-200 rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-xs font-bold text-primary-800 hover:text-primary-900 cursor-pointer bg-transparent border-none p-0"
      >
        + Add {label.replace(/s$/, '')}
      </button>
    </div>
  );
};

// --- Curriculum modules: each has a name + its own nested topics list ---
const CurriculumField = ({ modules, onChange }) => {
  const updateModule = (idx, field, value) => {
    const next = [...modules];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const removeModule = (idx) => onChange(modules.filter((_, i) => i !== idx));
  const addModule = () => onChange([...modules, { module: '', topics: [] }]);

  return (
    <div>
      <label className={labelClass}>Curriculum Modules</label>
      <div className="space-y-4">
        {modules.map((mod, idx) => (
          <div key={idx} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/40">
            <div className="flex gap-2 items-start">
              <input
                type="text"
                value={mod.module}
                onChange={(e) => updateModule(idx, 'module', e.target.value)}
                className={`${inputClass} bg-white`}
                placeholder="Module name (e.g. Web Foundations)"
              />
              <button
                type="button"
                onClick={() => removeModule(idx)}
                className="shrink-0 px-3 py-2.5 text-danger-text font-bold text-sm border border-neutral-200 rounded-lg hover:bg-danger-bg transition-colors bg-white cursor-pointer"
              >
                × Remove Module
              </button>
            </div>
            <div className="mt-3">
              <TextListField
                label="Topics"
                items={mod.topics}
                onChange={(topics) => updateModule(idx, 'topics', topics)}
                placeholder="e.g. Semantic HTML5 and modern CSS layouts"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addModule}
        className="mt-3 text-xs font-bold text-primary-800 hover:text-primary-900 cursor-pointer bg-transparent border-none p-0"
      >
        + Add Module
      </button>
    </div>
  );
};

const AdminCourseForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_COURSE);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    axios
      .get(`${API_URL}/api/admin/courses/${id}`, { withCredentials: true })
      .then((res) => {
        const c = res.data.course;
        setForm({
          title: c.title || '',
          category: c.category || 'web',
          duration: c.duration || '',
          seats: c.seats ?? 0,
          codingRequired: Boolean(c.codingRequired),
          languages: c.languages || [],
          tools: c.tools || [],
          desc: c.desc || '',
          tags: c.tags || '',
          roadmap: c.roadmap || [],
          tagline: c.tagline || '',
          curriculum: c.curriculum || [],
          careerOutcomes: c.careerOutcomes || [],
          idealFor: c.idealFor || '',
          isActive: c.isActive !== false,
        });
        setImagePreview(resolveImageUrl(c.imageUrl || c.img || ''));
        setSlug(c.slug || '');
      })
      .catch(() => setError('Failed to load course.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      seats: Number(form.seats) || 0,
      languages: form.languages.filter((v) => v.trim()),
      tools: form.tools.filter((v) => v.trim()),
      roadmap: form.roadmap.filter((v) => v.trim()),
      careerOutcomes: form.careerOutcomes.filter((v) => v.trim()),
      curriculum: form.curriculum
        .filter((m) => m.module.trim())
        .map((m) => ({ module: m.module, topics: m.topics.filter((t) => t.trim()) })),
    };

    try {
      let courseId = id;
      let savedCourse;
      if (isEdit) {
        const res = await axios.put(`${API_URL}/api/admin/courses/${id}`, payload, { withCredentials: true });
        savedCourse = res.data.course;
      } else {
        const res = await axios.post(`${API_URL}/api/admin/courses`, payload, { withCredentials: true });
        savedCourse = res.data.course;
        courseId = savedCourse._id;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await axios.post(`${API_URL}/api/admin/courses/${courseId}/image`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/admin/dashboard', {
        state: { toast: { title: savedCourse.title, slug: savedCourse.slug } },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8"><p className="text-sm text-neutral-500">Loading course...</p></div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">{isEdit ? 'Edit Course' : 'Add New Course'}</h1>
          <p className="text-sm text-neutral-500 mt-1">{isEdit ? 'Update this course. Changes go live on the public site immediately.' : 'Create a new course for the public catalog.'}</p>
        </div>
        {isEdit && slug && (
          <a
            href={`/programs/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 border border-primary-800 text-primary-800 font-bold text-xs rounded-lg hover:bg-primary-800 hover:text-white transition-colors no-underline whitespace-nowrap"
          >
            Preview on Live Site ↗
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* --- Basic Info --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Basic Info</h2>

          <div>
            <label className={labelClass}>Title</label>
            <input type="text" required value={form.title} onChange={(e) => setField('title', e.target.value)} className={inputClass} placeholder="Web Engineering with AI Tools (Full-Stack)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputClass}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input type="text" required value={form.duration} onChange={(e) => setField('duration', e.target.value)} className={inputClass} placeholder="6 Months" />
            </div>
            <div>
              <label className={labelClass}>Seats</label>
              <input type="number" min="0" value={form.seats} onChange={(e) => setField('seats', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} className={inputClass} placeholder="Short one-line hook shown on the course detail hero" />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea required rows={3} value={form.desc} onChange={(e) => setField('desc', e.target.value)} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className={labelClass}>Search Tags</label>
            <input type="text" value={form.tags} onChange={(e) => setField('tags', e.target.value)} className={inputClass} placeholder="web development, frontend, javascript" />
          </div>

          <div>
            <label className={labelClass}>Who This Is For (Ideal For)</label>
            <textarea rows={2} value={form.idealFor} onChange={(e) => setField('idealFor', e.target.value)} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 cursor-pointer">
              <input type="checkbox" checked={form.codingRequired} onChange={(e) => setField('codingRequired', e.target.checked)} className="w-4 h-4" />
              Coding Required
            </label>
          </div>
        </section>

        {/* --- Image --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Course Image</h2>
          <div className="flex items-center gap-5">
            {imagePreview && (
              <img src={imagePreview} alt="Course preview" className="w-32 h-24 object-cover rounded-lg border border-neutral-200" />
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="text-sm" />
              <p className="text-xs text-neutral-400 mt-1.5">Uploads to server/uploads/courses. Max 5MB.</p>
            </div>
          </div>
        </section>

        {/* --- Languages & Tools --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Languages &amp; Tools</h2>
          <TextListField label="Languages" items={form.languages} onChange={(v) => setField('languages', v)} placeholder="JavaScript" />
          <TextListField label="Tools" items={form.tools} onChange={(v) => setField('tools', v)} placeholder="React & Node.js" />
        </section>

        {/* --- Roadmap --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide mb-4">Roadmap Summary</h2>
          <TextListField label="Roadmap Steps" items={form.roadmap} onChange={(v) => setField('roadmap', v)} placeholder="Module 1: ..." />
        </section>

        {/* --- Curriculum --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide mb-4">Curriculum</h2>
          <CurriculumField modules={form.curriculum} onChange={(v) => setField('curriculum', v)} />
        </section>

        {/* --- Career Outcomes --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide mb-4">Career Outcomes</h2>
          <TextListField label="Career Outcomes" items={form.careerOutcomes} onChange={(v) => setField('careerOutcomes', v)} placeholder="Frontend Developer" />
        </section>

        {/* --- Admin Controls --- */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">Admin Controls</h2>

          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="w-4 h-4" />
            Active (visible on the public site)
          </label>
          <p className="text-xs text-neutral-400">
            Delivery mode and registration status are no longer set per-course here — they vary by campus and are shown generically on the public site. See the Course model comment for why.
          </p>
        </section>

        {error && <p className="text-sm text-danger-text">{error}</p>}

        <div className="flex items-center gap-3 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-900 text-white font-bold text-sm rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 border border-neutral-200 text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCourseForm;
