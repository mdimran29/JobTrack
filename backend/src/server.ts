import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`JobTrack API listening on http://localhost:${env.PORT}`);
});

// Give in-flight requests a chance to finish, then release the DB pool.
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((error) => console.error('Error disconnecting Prisma:', error))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
