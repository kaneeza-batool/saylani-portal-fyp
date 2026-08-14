import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

// Shared by every public page that needs the full active-course list
// (Programs, Home's featured section, Enroll Now, the Find Your Path quiz).
const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_URL}/api/courses`)
      .then((res) => {
        if (!cancelled) setCourses(res.data.courses);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load courses.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading, error };
};

export default useCourses;
