/**
 * API Client — single place that talks to the backend.
 *
 * Auth headers, error handling, and the base URL are defined once.
 * Every network call goes through this file.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach JWT ──
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: handle 401 ──
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  signup: (data) => client.post('/auth/signup', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
};

// ── Accounts ──
export const accountsAPI = {
  createLinkToken: () => client.post('/accounts/link-token'),
  exchangeToken: (publicToken) =>
    client.post('/accounts/exchange-token', { public_token: publicToken }),
  listAccounts: () => client.get('/accounts/'),
};

// ── Transactions ──
export const transactionsAPI = {
  list: (params) => client.get('/transactions/', { params }),
  createOverride: (data) => client.post('/transactions/manual-override', data),
};

// ── Forecast ──
export const forecastAPI = {
  getForecast: () => client.get('/forecast/'),
};

// ── Alerts ──
export const alertsAPI = {
  list: (params) => client.get('/alerts/', { params }),
};

// ── Health ──
export const healthAPI = {
  check: () => client.get('/health'),
};

export default client;
