import { Request, Response } from 'express';
import { env } from '../../config/env';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { authService } from './auth.service';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  });
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.register(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ data: user });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);
    res.status(200).json({ data: user });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getById((req as AuthedRequest).userId);
    res.status(200).json({ data: user });
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile((req as AuthedRequest).userId, req.body);
    res.status(200).json({ data: user });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.status(200).json({ data: { success: true } });
  }),
};
