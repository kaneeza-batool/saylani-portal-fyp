import api from './authService';

export async function getAssignments() {
  const { data } = await api.get('/assignment');
  return data.assignments;
}

export async function getAssignmentSummary() {
  const { data } = await api.get('/assignment/summary');
  return data;
}

export async function getAssignmentDetail(id) {
  const { data } = await api.get(`/assignment/${id}`);
  return data;
}

export async function submitAssignment(id, payload) {
  const { data } = await api.post(`/assignment/${id}/submit`, payload);
  return data.submission;
}
