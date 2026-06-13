import { api } from '../lib/api';
import type { SafeUser } from '../types/api';

export async function fetchMe(): Promise<SafeUser> {
  const { data } = await api.get<{ user: SafeUser }>('/auth/me');
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/** Full-page redirect target that starts the GitHub OAuth flow. */
export function githubLoginUrl(): string {
  return `${import.meta.env.VITE_API_BASE_URL}/auth/github`;
}
