import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const message = (text: string) => ({ error: { message: text, code: 'RATE_LIMITED' } });

// Generous ceiling for normal SPA usage; stops runaway clients and scrapers.
export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests. Please slow down and try again shortly.'),
});

// Login/register: slows down credential stuffing and account enumeration.
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Too many sign-in attempts. Try again in 15 minutes.'),
});

// AI-backed endpoints cost money per call and are slow; keep them from being hammered.
export const aiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many analysis requests. Try again in a few minutes.'),
});

// pdflatex is CPU-heavy and runs untrusted input; keep it tightly capped.
export const latexLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many PDF exports. Try again in a few minutes.'),
});
