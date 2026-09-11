import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../common/AppError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-based auth. Browsers always attach an Origin header to
 * cross-origin POST/PATCH/DELETE requests (including plain HTML form posts, which CORS
 * does not block), so any state-changing request whose Origin is not one of ours is rejected.
 * Requests without an Origin header (curl, Postman, server-to-server) are allowed through
 * because they cannot carry a victim's browser cookie.
 */
export const requireTrustedOrigin = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');
  if (origin) {
    if (!env.CLIENT_ORIGINS.includes(origin.replace(/\/+$/, ''))) {
      next(new AppError(403, 'Request origin is not allowed', 'UNTRUSTED_ORIGIN'));
      return;
    }
    next();
    return;
  }

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    next(new AppError(403, 'Request origin is not allowed', 'UNTRUSTED_ORIGIN'));
    return;
  }

  next();
};
