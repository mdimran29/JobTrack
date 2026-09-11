import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../common/AppError';
import { AuthedRequest } from '../common/types';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  try {
    // Pin the algorithm so a token signed with "none" or an asymmetric key can never verify.
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload !== 'object' || typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Malformed token payload');
    }
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired session');
  }
};
