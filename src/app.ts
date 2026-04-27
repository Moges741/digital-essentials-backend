import express, { Request, Response, NextFunction } from 'express';
import { AppError } from './utils/errors';
import { sendError } from './utils/response';
import authRoutes from './routes/auth.routes';
const app = express();

// ── Body parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Digital Essentials API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes (we add these as we build each module) ─────────
app.use('/api/auth',        authRoutes);
// app.use('/api/courses',     courseRoutes);
// app.use('/api/enrollments', enrollmentRoutes);
// app.use('/api/progress',    progressRoutes);
// app.use('/api/forum',       forumRoutes);

// ── 404 handler ───────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404);
});

// ── Global error handler ──────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }
  console.error('Unexpected error:', err);
  return sendError(res, 'Internal server error', 500);
});

export default app;
