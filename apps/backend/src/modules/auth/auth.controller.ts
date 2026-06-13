import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';

import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import {
  buildAuthorizeUrl,
  handleOAuthCallback,
  issueToken,
  getUserById,
  toSafeUser,
} from './auth.service.js';

const AUTH_COOKIE = 'token';
const STATE_COOKIE = 'oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000; // OAuth round-trip window.

/** Cookie attributes for the session JWT. httpOnly => unreadable by JS. */
function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: env.JWT_EXPIRES_IN_SECONDS * 1000,
  };
}

function stateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax', // Sent on the top-level redirect back from GitHub.
    path: '/',
    maxAge: STATE_TTL_MS,
  };
}

/** Constant-time string comparison to avoid leaking timing on the CSRF check. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** GET /auth/github — start the OAuth dance. */
export function login(_req: Request, res: Response): void {
  const state = randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, stateCookieOptions());
  res.redirect(buildAuthorizeUrl(state));
}

/** GET /auth/github/callback — GitHub redirects here with `code` + `state`. */
export async function callback(req: Request, res: Response): Promise<void> {
  // User declined consent, or GitHub returned an error.
  if (typeof req.query.error === 'string') {
    res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(req.query.error)}`);
    return;
  }

  const code = req.query.code;
  const state = req.query.state;
  const expectedState = req.cookies?.[STATE_COOKIE] as string | undefined;

  if (typeof code !== 'string' || typeof state !== 'string') {
    throw HttpError.badRequest('Missing OAuth code or state');
  }
  if (!expectedState || !safeEqual(state, expectedState)) {
    throw HttpError.badRequest('Invalid OAuth state');
  }

  // State is single-use.
  res.clearCookie(STATE_COOKIE, { path: '/' });

  const { token } = await handleOAuthCallback(code);

  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  res.redirect(env.CLIENT_URL);
}

/** GET /auth/me — current user (protected). */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await getUserById(req.user!.id);
  if (!user) {
    throw HttpError.unauthorized('User no longer exists');
  }
  res.json({ user: toSafeUser(user) });
}

/** POST /auth/refresh — slide the session forward (protected). */
export function refresh(req: Request, res: Response): void {
  const token = issueToken(req.user!.id);
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  res.json({ success: true });
}

/** POST /auth/logout — clear the session cookie. */
export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: undefined });
  res.json({ success: true });
}
