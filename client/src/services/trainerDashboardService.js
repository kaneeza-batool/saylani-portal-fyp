import api from './authService';

export async function getTrainerDashboard() {
  const { data } = await api.get('/trainer/dashboard');
  return data;
}

export async function getTrainerCourses() {
  const { data } = await api.get('/trainer/courses');
  return data.items;
}

export async function getMyQuizzes() {
  const { data } = await api.get('/trainer/quizzes');
  return data.items;
}

export async function createQuiz(payload) {
  const { data } = await api.post('/trainer/quizzes', payload);
  return data.quiz;
}

export async function getMyAssignments() {
  const { data } = await api.get('/trainer/assignments');
  return data.items;
}

export async function createAssignment(payload) {
  const { data } = await api.post('/trainer/assignments', payload);
  return data.assignment;
}

export async function getPendingSubmissions() {
  const { data } = await api.get('/trainer/submissions/pending');
  return data.items;
}

export async function getReviewedSubmissions() {
  const { data } = await api.get('/trainer/submissions/reviewed');
  return data.items;
}

export async function getPendingReviewCount() {
  const { data } = await api.get('/trainer/submissions/pending-count');
  return data.count;
}

export async function getAssignmentRoster(id) {
  const { data } = await api.get(`/trainer/assignments/${id}/roster`);
  return data;
}

export async function getMyAttendanceCourses() {
  const { data } = await api.get('/trainer/attendance/courses');
  return data.items;
}

export async function getAttendanceRoster(course, date) {
  const { data } = await api.get('/trainer/attendance', { params: { course, date } });
  return data.roster;
}

export async function markAttendance(payload) {
  const { data } = await api.post('/trainer/attendance', payload);
  return data;
}

export async function reviewSubmission(id, payload) {
  const { data } = await api.patch(`/trainer/submissions/${id}/review`, payload);
  return data.submission;
}

export async function getMyStudents(batchId) {
  const { data } = await api.get('/trainer/students', { params: batchId ? { batch: batchId } : {} });
  return data.items;
}

export async function setStudentGrade(studentId, grade) {
  const { data } = await api.patch(`/trainer/students/${studentId}/grade`, { grade });
  return data.student;
}
