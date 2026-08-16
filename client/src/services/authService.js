import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Endpoints that don't run against an existing access token, so a 401 from
// them is a real auth failure, never something to silently retry via a
// refresh. Same reasoning/shape as student-portal's authService.js.
const SKIP_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/register-trainer'];

// Single in-flight refresh shared across every request that 401s at the
// same time, so several queries firing together right as the access token
// expires don't each kick off their own POST /auth/refresh.
let refreshPromise = null;

// Transparent silent-refresh: on a 401, use the refresh token to mint a new
// access token and retry the original request once. Without this, the
// access token's 15-minute lifetime forced a full logout on any request gap
// longer than that, even with a still-valid 7-day refresh token sitting in
// the cookie jar unused.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldSkip = !originalRequest || SKIP_REFRESH_PATHS.some((path) => originalRequest.url?.includes(path));

    if (error.response?.status !== 401 || shouldSkip || originalRequest._retried) {
      return Promise.reject(error);
    }
    originalRequest._retried = true;

    try {
      refreshPromise = refreshPromise || api.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function updateMe(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.user;
}

export async function registerTrainer(payload) {
  const { data } = await api.post('/auth/register-trainer', payload);
  return data.user;
}

export async function registerEmployer(payload) {
  const { data } = await api.post('/auth/register-employer', payload);
  return data.user;
}

export async function fetchPublicCampuses() {
  const { data } = await api.get('/public/campuses');
  return data.items;
}

export default api;
