import app from './app';
import { env } from './config/env';
import db from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection before starting
    await db.raw('SELECT 1');
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
