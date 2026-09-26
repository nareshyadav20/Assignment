import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Multi-Tenant Security Platform API running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🛡️  API Endpoints mounted at: http://localhost:${PORT}/api/v1`);

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to database on startup:', error.message);
  }
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database client disconnected.');
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
