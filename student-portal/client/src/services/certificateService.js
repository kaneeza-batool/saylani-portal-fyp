import axios from 'axios';
import api from './authService';

export async function getEligibleCertificates() {
  const { data } = await api.get('/certificates/eligible');
  return data.certificates;
}

export async function getCertificateForCourse(courseId) {
  const { data } = await api.get(`/certificates/course/${courseId}`);
  return data;
}

// PUBLIC — deliberately its own plain axios instance (no withCredentials,
// no auth interceptor) since /verify is reachable by anyone with the link,
// logged in or not, and must never depend on a session cookie existing.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

export async function verifyCertificate(certificateId) {
  const { data } = await publicApi.get(`/certificates/verify/${certificateId}`);
  return data;
}
