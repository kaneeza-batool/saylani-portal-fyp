import api from './authService';

export async function getQuestions(courseId, { sort, search } = {}) {
  const { data } = await api.get(`/questions/course/${courseId}`, { params: { sort, search } });
  return data.questions;
}

export async function createQuestion(courseId, payload) {
  const { data } = await api.post(`/questions/course/${courseId}`, payload);
  return data.question;
}

export async function getQuestionDetail(questionId) {
  const { data } = await api.get(`/questions/${questionId}`);
  return data;
}

export async function createAnswer(questionId, body) {
  const { data } = await api.post(`/questions/${questionId}/answers`, { body });
  return data.answer;
}

export async function upvoteQuestion(questionId) {
  const { data } = await api.patch(`/questions/${questionId}/upvote`);
  return data;
}

export async function upvoteAnswer(answerId) {
  const { data } = await api.patch(`/questions/answers/${answerId}/upvote`);
  return data;
}

export async function markAcceptedAnswer(answerId) {
  const { data } = await api.patch(`/questions/answers/${answerId}/accept`);
  return data.answer;
}
