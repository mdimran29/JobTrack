import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schema';
import { authLimiter } from '../../middleware/rate-limit.middleware';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.get('/me', authMiddleware, authController.me);
authRouter.post('/logout', authController.logout);
authRouter.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile
);
