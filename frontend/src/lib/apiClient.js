import axios from 'axios';

const explicitApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const normalizedApiUrl = explicitApiUrl.replace(/\/+$/, '');

const api = axios.create({
  // Prefer same-origin /api so Vite proxy handles local dev and avoids CORS/network edge cases.
  baseURL: normalizedApiUrl ? `${normalizedApiUrl}/api` : '/api',
  withCredentials: true,
});

export default api;
