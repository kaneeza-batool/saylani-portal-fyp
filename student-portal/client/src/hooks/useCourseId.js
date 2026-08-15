import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STORAGE_KEY = 'titan_last_course_id';

// Course-scoped pages (Attendance/Assignment/Fee/Quiz/Progress/Dashboard) all
// carry :courseId in their route, so useParams() has it directly. Pages
// outside that scope (Courses, Profile) don't — Sidebar/TopBar still render
// there, so they fall back to the last course the student was actually on,
// remembered here, rather than linking to "/attendance/undefined".
export function useCourseId() {
  const { courseId } = useParams();

  useEffect(() => {
    if (courseId) localStorage.setItem(STORAGE_KEY, courseId);
  }, [courseId]);

  return courseId || localStorage.getItem(STORAGE_KEY) || null;
}
