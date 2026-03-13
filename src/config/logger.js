const winston = require('winston');
const path = require('path');
const fs = require('fs');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

const logsDir = path.join(__dirname, '../../logs');
const appLogsDir = path.join(logsDir, 'application');
const dbLogsDir = path.join(logsDir, 'database');
const systemLogsDir = path.join(logsDir, 'system');
const debugLogsDir = path.join(logsDir, 'debug');
const perfLogsDir = path.join(logsDir, 'performance');

[logsDir, appLogsDir, dbLogsDir, systemLogsDir, debugLogsDir, perfLogsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const logger = winston.createLogger({
  level: isDev ? (process.env.LOG_LEVEL || 'debug') : (process.env.LOG_LEVEL || 'info'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(appLogsDir, 'application.log'),
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(appLogsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

if (isDev) {
  logger.add(new winston.transports.File({
    filename: path.join(debugLogsDir, 'debug.log'),
    level: 'debug',
    maxsize: 10485760,
    maxFiles: 3
  }));
}

const dbLogger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(dbLogsDir, 'database.log'),
      maxsize: 10485760,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(dbLogsDir, 'slow-queries.log'),
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

const perfLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(perfLogsDir, 'performance.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

if (isDev) {
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, durationMs, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (durationMs !== undefined) {
        msg += ` (${durationMs}ms)`;
      }
      const keys = Object.keys(meta);
      if (keys.length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  );
  
  logger.add(new winston.transports.Console({ format: consoleFormat }));
  dbLogger.add(new winston.transports.Console({ format: consoleFormat }));
  perfLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
module.exports.dbLogger = dbLogger;
module.exports.perfLogger = perfLogger;
