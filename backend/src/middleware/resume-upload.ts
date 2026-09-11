import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../common/AppError';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  // One file per request; keep field sizes in line with the JSON schemas so multipart can't bypass them.
  limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 10, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, callback) => {
    const name = file.originalname.toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || name.endsWith('.pdf');
    const isText = file.mimetype === 'text/plain' || name.endsWith('.txt');
    const isLatex = name.endsWith('.tex');
    if (isPdf || isText || isLatex) {
      callback(null, true);
      return;
    }
    callback(new AppError(400, 'Upload a PDF, TXT, or LaTeX (.tex) resume.', 'INVALID_FILE_TYPE'));
  },
});

export const handleResumeUpload = (req: Request, res: Response, next: NextFunction) =>
  resumeUpload.single('resume')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 'Resume must be smaller than 5 MB.', 'FILE_TOO_LARGE'));
      return;
    }
    next(error);
  });
