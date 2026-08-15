import api from './authService';

export async function getQuizzes() {
  const { data } = await api.get('/quiz');
  return data.quizzes;
}

export async function getQuizForTaking(quizId) {
  const { data } = await api.get(`/quiz/${quizId}/take`);
  return data.quiz;
}

export async function startAttempt(quizId) {
  const { data } = await api.post(`/quiz/${quizId}/start`);
  return data;
}

export async function submitAttempt(quizId, payload) {
  const { data } = await api.post(`/quiz/${quizId}/submit`, payload);
  return data;
}

export async function getAttemptResult(attemptId) {
  const { data } = await api.get(`/quiz/result/${attemptId}`);
  return data;
}
