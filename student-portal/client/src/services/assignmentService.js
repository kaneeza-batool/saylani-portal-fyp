import api from './authService';

export async function getAssignments(courseId) {
  const { data } = await api.get(`/assignment/${courseId}`);
  return data.assignments;
}

export async function getAssignmentSummary(courseId) {
  const { data } = await api.get(`/assignment/${courseId}/summary`);
  return data;
}

export async function getAssignmentDetail(courseId, id) {
  const { data } = await api.get(`/assignment/${courseId}/${id}`);
  return data;
}

export async function submitAssignment(courseId, id, payload) {
  const { data } = await api.post(`/assignment/${courseId}/${id}/submit`, payload);
  return data.submission;
}
