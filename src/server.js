require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const { startAllJobs } = require('./jobs');
const app = require('./app');
const { testConnection, closeConnection } = require('./config/db');
const logger = require('./config/logger');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true' && NODE_ENV === 'production';

const calculateWorkers = () => {
  const numCPUs = os.cpus().length;
  
  if (process.env.WORKERS) {
    return parseInt(process.env.WORKERS);
  }
  
  if (process.env.WORKER_50 === 'true') {
    return Math.max(1, Math.floor(numCPUs / 2));
  }
  
  return Math.max(1, numCPUs - 2);
};

const startHttpServer = () => {
  const server = app.listen(PORT, async () => {
    const workerId = cluster.isWorker ? `Worker ${cluster.worker.id}` : 'Single process';
    logger.info(`${workerId} started on port ${PORT} in ${NODE_ENV} mode`);
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed. Exiting...');
      process.exit(1);
    }

    // Sync tables that may not exist in the initial schema
    try {
      const db = require('./models');
      await db.AgreementDocument.sync({ alter: true });
      await db.AgreementEvent.sync({ alter: true });
      await db.PropertyImage.sync({ alter: true });
      // Ensure Agreement table has all extra columns (accepted_at, closed_at, etc.)
      await db.Agreement.sync({ alter: true });
      logger.info('✓ Extended tables synced successfully');
    } catch (syncErr) {
      logger.warn('Table sync warning (non-fatal):', syncErr.message);
    }

    initSocket(server);
    
    if (!cluster.isWorker || cluster.worker.id === 1) {
      startAllJobs();
    }
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeConnection();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  return server;
};

if (ENABLE_CLUSTER && cluster.isMaster) {
  const workers = calculateWorkers();
  const numCPUs = os.cpus().length;
  
  logger.info(`Master process ${process.pid} starting ${workers} workers (${numCPUs} CPUs available)...`);
  
  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
  
  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
  
} else {
  startHttpServer();
}

module.exports = { app, startHttpServer };
