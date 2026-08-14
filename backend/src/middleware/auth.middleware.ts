import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../common/AppError';
import { AuthedRequest } from '../common/types';

interface JwtPayload {
  sub: string;
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired session');
  }
};
