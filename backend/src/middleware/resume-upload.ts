import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../common/AppError';

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isText = file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt');
    const isLatex = file.originalname.toLowerCase().endsWith('.tex');
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
