import api from './authService';

export async function getQuizzes(courseId) {
  const { data } = await api.get(`/quiz/${courseId}`);
  return data.quizzes;
}

export async function getQuizForTaking(courseId, quizId) {
  const { data } = await api.get(`/quiz/${courseId}/${quizId}/take`);
  return data.quiz;
}

export async function startAttempt(courseId, quizId) {
  const { data } = await api.post(`/quiz/${courseId}/${quizId}/start`);
  return data;
}

export async function submitAttempt(courseId, quizId, payload) {
  const { data } = await api.post(`/quiz/${courseId}/${quizId}/submit`, payload);
  return data;
}

export async function getAttemptResult(attemptId) {
  const { data } = await api.get(`/quiz/result/${attemptId}`);
  return data;
}
