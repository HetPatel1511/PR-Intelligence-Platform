import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

/** Claims we put in the session JWT. `sub` is the platform user id. */
export interface AppJwtPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
  });
}

/**
 * Verifies signature + expiry and returns the typed payload.
 * Throws (JsonWebTokenError / TokenExpiredError) on any invalid token.
 */
export function verifyToken(token: string): AppJwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Malformed token payload');
  }

  return { sub: decoded.sub };
}
