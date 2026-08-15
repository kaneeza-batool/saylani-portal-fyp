import api from './authService';

export async function getSkillPassport() {
  const { data } = await api.get('/skill-passport');
  return data;
}
