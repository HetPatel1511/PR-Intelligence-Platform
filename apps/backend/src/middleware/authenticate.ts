import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../lib/jwt.js';
import { HttpError } from '../utils/http-error.js';
import { getUserById } from '../modules/auth/auth.service.js';

/**
 * Gate for protected routes. Reads the session JWT from the httpOnly cookie,
 * verifies it, confirms the user still exists (cheap revocation check), and
 * attaches a minimal `req.user`. Any failure becomes a 401.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.token as string | undefined;
    if (!token) {
      throw HttpError.unauthorized('Authentication required');
    }

    const { sub } = verifyToken(token);
    const user = await getUserById(sub);
    if (!user) {
      throw HttpError.unauthorized('User no longer exists');
    }

    req.user = {
      id: user.id,
      githubId: user.githubId.toString(),
      login: user.login,
    };
    next();
  } catch (err) {
    // Normalize JWT library errors (expired/invalid) into a 401.
    if (err instanceof HttpError) {
      next(err);
    } else {
      next(HttpError.unauthorized('Invalid or expired token'));
    }
  }
}
