import axios from 'axios';

/**
 * Shared Axios instance. `withCredentials` lets the session cookie flow to the
 * API for authenticated requests. Feature code should import this rather than
 * calling axios directly, so base URL and interceptors stay centralized.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
