import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5100/api',
  withCredentials: true,
});

// Endpoints that don't run against an existing access token, so a 401 from
// them is a real auth failure (wrong password, invalid/expired reset link,
// etc.) — never something to silently retry via a refresh.
const SKIP_REFRESH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-cnic',
  '/auth/set-password',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Single in-flight refresh shared across every request that 401s at the
// same time (e.g. several queries firing together right as the access
// token expires) — without this, each would kick off its own POST
// /auth/refresh and race to reissue the cookie.
let refreshPromise = null;

// Transparent silent-refresh: on a 401, use the refresh token to mint a
// new access token and retry the original request once. This is what
// makes the access token's short 15-minute lifetime invisible to the
// student — without it, any gap over 15 minutes between requests reads as
// a full logout even though the 7-day refresh token is still valid.
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

export async function login(cnic, password) {
  const { data } = await api.post('/auth/login', { cnic, password });
  return data.student;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.student;
}

export async function verifyCnic(cnic) {
  const { data } = await api.post('/auth/verify-cnic', { cnic });
  return data;
}

export async function setPassword(cnic, password) {
  const { data } = await api.post('/auth/set-password', { cnic, password });
  return data;
}

export async function forgotPassword(cnic) {
  const { data } = await api.post('/auth/forgot-password', { cnic });
  return data.message;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data.message;
}

export default api;
