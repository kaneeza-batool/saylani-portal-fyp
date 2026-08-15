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
