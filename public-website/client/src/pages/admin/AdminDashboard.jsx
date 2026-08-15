import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CATEGORY_LABELS } from '../../data/categoryLabels';

/* ============================================================
   TITAN — Admin Dashboard (/admin/dashboard)
   Table of every course (active + inactive) with Edit/Deactivate/Add New.
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const AdminDashboard = () => {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState(location.state?.toast || null);

  useEffect(() => {
    if (!location.state?.toast) return;
    window.history.replaceState({}, '');
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/courses`, { withCredentials: true });
      setCourses(res.data.courses);
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDeactivate = async (course) => {
    setActionError('');
    if (!window.confirm(`Deactivate "${course.title}"? It will disappear from the public site immediately, but can be reactivated later from Edit.`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/admin/courses/${course._id}`, { withCredentials: true });
      loadCourses();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to deactivate course.');
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      {toast && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-success-bg border border-success-text/20 rounded-lg">
          <p className="text-sm font-semibold text-success-text">
            Saved <span className="font-bold">{toast.title}</span>.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            {toast.slug && (
              <a
                href="/programs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-success-text hover:underline no-underline whitespace-nowrap"
              >
                View on Programs page →
              </a>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-success-text/60 hover:text-success-text bg-transparent border-none cursor-pointer text-lg leading-none p-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Course Catalog</h1>
          <p className="text-sm text-neutral-500 mt-1">{courses.length} total course{courses.length === 1 ? '' : 's'}</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="px-5 py-2.5 bg-accent-600 text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all no-underline"
        >
          + Add New Course
        </Link>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading courses...</p>}
      {error && <p className="text-sm text-danger-text">{error}</p>}
      {actionError && <p className="text-sm text-danger-text mb-4">{actionError}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Title</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="text-left px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-bold text-neutral-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                  <td className="px-4 py-3 font-semibold text-neutral-900 max-w-xs truncate">{course.title}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{CATEGORY_LABELS[course.category] || course.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border whitespace-nowrap ${
                        course.isActive
                          ? 'text-success-text bg-success-bg border-success-text/20'
                          : 'text-neutral-400 bg-neutral-100 border-neutral-200'
                      }`}
                    >
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/admin/courses/${course._id}/edit`} className="text-primary-800 font-bold text-xs hover:underline mr-4">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeactivate(course)}
                      disabled={!course.isActive}
                      className="text-danger-text font-bold text-xs hover:underline disabled:text-neutral-300 disabled:no-underline disabled:cursor-not-allowed bg-transparent border-none p-0 cursor-pointer"
                    >
                      {course.isActive ? 'Deactivate' : 'Deactivated'}
                    </button>
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

export default AdminDashboard;
