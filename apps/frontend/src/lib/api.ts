import axios, { AxiosError } from 'axios';

/**
 * Shared Axios instance. `withCredentials` lets the session cookie flow to the
 * API for authenticated requests. Feature code should import this rather than
 * calling axios directly, so base URL and interceptors stay centralized.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/** Normalize an unknown error into the backend's `{ error }` message. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const serverMessage = (error.response?.data as { error?: string } | undefined)?.error;
    return serverMessage ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
