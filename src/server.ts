import app from './app';
import { env } from './config/env';
import db from './config/db';

const startServer = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1 + 1 AS result');
    console.log('✅ Database connected successfully');

    app.listen(env.app.port, () => {
      console.log(`🚀 Server running on port ${env.app.port}`);
      console.log(`📍 Health check: http://localhost:${env.app.port}/health`);
      console.log(`🌍 Environment: ${env.app.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();