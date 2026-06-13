import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { login, callback, me, refresh, logout } from './auth.controller.js';

export const authRouter = Router();

// --- Public OAuth flow ---
authRouter.get('/github', login);
authRouter.get('/github/callback', asyncHandler(callback));

// --- Protected session endpoints ---
authRouter.get('/me', authenticate, asyncHandler(me));
authRouter.post('/refresh', authenticate, refresh);
authRouter.post('/logout', authenticate, logout);
