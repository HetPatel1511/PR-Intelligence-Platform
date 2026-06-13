import type { AuthUser } from '../modules/auth/auth.types.ts';

// Augment Express's Request so authenticated handlers can read `req.user`
// in a fully typed way after the `authenticate` middleware runs.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
