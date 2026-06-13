import axios from 'axios';
import type { User } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { encrypt } from '../../lib/crypto.js';
import { signToken } from '../../lib/jwt.js';
import { HttpError } from '../../utils/http-error.js';
import type { GitHubTokenResponse, GitHubUserProfile, SafeUser } from './auth.types.js';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

/**
 * Stateless OAuth + JWT auth. Responsibilities are split so the controller only
 * deals with HTTP concerns:
 *   - build the GitHub consent URL
 *   - exchange the auth code for an access token
 *   - read the GitHub profile
 *   - persist the user (token encrypted at rest)
 *   - mint our own session JWT
 */

/** Step 1: where we send the browser to grant access. */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: env.GITHUB_SCOPES,
    state,
    allow_signup: 'false',
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/** Step 2: trade the short-lived `code` for a GitHub access token. */
async function exchangeCodeForToken(code: string): Promise<string> {
  const { data } = await axios.post<GitHubTokenResponse>(
    GITHUB_TOKEN_URL,
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    },
    { headers: { Accept: 'application/json' } },
  );

  if (data.error || !data.access_token) {
    throw HttpError.badGateway(data.error_description ?? 'Failed to obtain GitHub access token');
  }

  return data.access_token;
}

/** Step 3: identify the user behind the token. */
async function fetchGitHubProfile(accessToken: string): Promise<GitHubUserProfile> {
  const { data } = await axios.get<GitHubUserProfile>(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  return data;
}

/** Step 4: create or update the user, storing the token encrypted. */
async function upsertUser(profile: GitHubUserProfile, accessToken: string): Promise<User> {
  const githubId = BigInt(profile.id);
  const data = {
    login: profile.login,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    accessToken: encrypt(accessToken),
  };

  return prisma.user.upsert({
    where: { githubId },
    update: data,
    create: { githubId, ...data },
  });
}

/**
 * Full callback flow: code in, persisted user + freshly signed JWT out.
 */
export async function handleOAuthCallback(code: string): Promise<{ user: User; token: string }> {
  const accessToken = await exchangeCodeForToken(code);
  const profile = await fetchGitHubProfile(accessToken);
  const user = await upsertUser(profile, accessToken);
  return { user, token: signToken(user.id) };
}

/** Re-issue a JWT for an already-authenticated user (sliding expiration). */
export function issueToken(userId: string): string {
  return signToken(userId);
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

/** Strip secrets and serialize BigInt before sending a user to the client. */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    githubId: user.githubId.toString(),
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}
