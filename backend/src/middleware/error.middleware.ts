import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '../common/AppError';

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
};

interface BodyParserError {
  type?: string;
  status?: number;
}

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: { message: `Upload rejected: ${err.message}`, code: 'INVALID_UPLOAD' } });
    return;
  }

  // body-parser failures (malformed JSON, oversized payload) are client errors, not crashes.
  const bodyError = err as BodyParserError;
  if (bodyError?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Request body is not valid JSON', code: 'INVALID_JSON' } });
    return;
  }
  if (bodyError?.type === 'entity.too.large') {
    res.status(413).json({ error: { message: 'Request body is too large', code: 'PAYLOAD_TOO_LARGE' } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { message: 'A record with these details already exists' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { message: 'Record not found' } });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: { message: 'Invalid request data', code: 'VALIDATION_ERROR' } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
