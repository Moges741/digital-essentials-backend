import express, { Request, Response, NextFunction } from 'express';
import { AppError } from './utils/errors';
import { sendError } from './utils/response';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import progressRoutes from './routes/progress.routes';
import materialRoutes from './routes/material.routes';
import exerciseRoutes from './routes/exercise.routes';
import feedbackRoutes from './routes/feedback.routes';
import certificateRoutes from './routes/certificate.routes';
import chatRoutes from './routes/chat.routes';
const app = express();

// ── Body parsers ─────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Digital Essentials API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes (we add these as we build each module)
app.use('/api/auth',      authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/courses/:course_id/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress',    progressRoutes);
app.use('/api/courses/:course_id/materials', materialRoutes);
app.use('/api/courses/:course_id/exercises', exerciseRoutes);
app.use('/api/feedback',    feedbackRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/chat',         chatRoutes);
// app.use('/api/forum',       forumRoutes);

// ── 404 handler ──────
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404);
});

// ── Global error handler ────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }
  console.error('Unexpected error:', err);
  return sendError(res, 'Internal server error', 500);
});

export default app;
