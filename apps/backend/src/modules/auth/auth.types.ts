/** Minimal identity attached to `req.user` by the authenticate middleware. */
export interface AuthUser {
  id: string;
  githubId: string;
  login: string;
}

/** Response from GitHub's access-token exchange endpoint. */
export interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/** Subset of GitHub's `GET /user` response we consume. */
export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/** User shape safe to send to the browser (no token, BigInt as string). */
export interface SafeUser {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}
