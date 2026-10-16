import axios from 'axios';
import { api, API_BASE_URL } from '../config/api';

let isRefreshing = false;
let refreshPromise = null;

async function executeTokenRefresh() {
  const refreshToken = localStorage.getItem('helpdesk_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh: refreshToken,
  });

  const { access, refresh: newRefresh } = response.data;
  localStorage.setItem('helpdesk_access_token', access);
  if (newRefresh) {
    localStorage.setItem('helpdesk_refresh_token', newRefresh);
  }

  return access;
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('helpdesk_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/token/refresh');

    if (status === 401 && !isAuthEndpoint && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('helpdesk_refresh_token');

      if (refreshToken) {
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = executeTokenRefresh().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }

          const newAccessToken = await refreshPromise;
          if (originalRequest.headers?.set) {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
          } else if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        } catch {
          localStorage.removeItem('helpdesk_access_token');
          localStorage.removeItem('helpdesk_refresh_token');
          window.dispatchEvent(new CustomEvent('helpdesk:auth-expired'));
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
    }

    const resData = error.response?.data;
    let message = '';

    if (resData?.details && typeof resData.details === 'object') {
      message = Object.values(resData.details).flat().join(', ');
    } else if (resData?.message) {
      message = resData.message;
    } else if (resData?.detail) {
      message = resData.detail;
    } else if (resData?.error && typeof resData.error === 'string') {
      message = resData.error;
    } else if (resData && typeof resData === 'object') {
      message = Object.values(resData).flat().join(', ');
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Network error: Unable to reach the server. Please verify backend is running on port 8000.';
    } else {
      message = error.message || 'An unexpected error occurred';
    }

    const normalizedError = new Error(message);
    normalizedError.status = status || 0;
    normalizedError.data = resData;

    return Promise.reject(normalizedError);
  }
);

export { api };
