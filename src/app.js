const express = require('express');
const path = require('path');
const { initMiddleware } = require('./middleware/initMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { trackAPIPerformance, getAPIStats, getTopSlowAPIs } = require('./middleware/apiTracker');
const logger = require('./config/logger');
const cache = require('./utils/cache');

const app = express();

// 1. Core performance & static files (BEFORE complex security logic)
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// 2. Initialize security and other middleware
initMiddleware(app);

if (process.env.ENABLE_ACTION_LOGGING !== 'false') {
  const actionLogger = require('./middleware/actionLogger');
  app.use(actionLogger);
}

if (process.env.ENABLE_API_TRACKING !== 'false') {
  app.use(trackAPIPerformance);
}

if (process.env.ENABLE_SWAGGER !== 'false') {
  const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  logger.info('Swagger documentation available at /api-docs');
}

// Health routes
app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    cache: cache.getStats()
  });
});

app.get('/health/db', async (req, res) => {
  const db = require('./models');
  try {
    const startTime = Date.now();
    await db.sequelize.authenticate();
    const latency = Date.now() - startTime;

    let tableQuery;
    const dialect = db.sequelize.getDialect();
    
    if (dialect === 'postgres') {
      tableQuery = "SELECT tablename as \"TABLE_NAME\" FROM pg_catalog.pg_tables WHERE schemaname = 'public'";
    } else {
      tableQuery = "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()";
    }

    const [tables] = await db.sequelize.query(tableQuery);

    const tableStats = {};
    for (const t of tables) {
      const tableName = t.TABLE_NAME || t.tablename;
      // In Postgres we don't easily get row counts from pg_tables without separate queries or estimation
      tableStats[tableName] = { estimatedRows: t.TABLE_ROWS || 0 };
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: latency,
        dialect: db.sequelize.getDialect(),
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
        tables: tableStats
      }
    });
  } catch (error) {
    logger.error('Health/db check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

app.get('/health/detailed', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cache.getStats(),
    api: {
      stats: getAPIStats(),
      slowest: getTopSlowAPIs(5)
    }
  });
});

// API Routes
app.use('/api/v1', require('./routes'));

// 5. Catch-all route for SPA (React)
app.get('*', (req, res, next) => {
  // Never serve index.html for API or static asset requests
  if (req.path.startsWith('/api/v1') || req.path.match(/\.(css|js|png|jpg|jpeg|svg|ico|json|map|woff2?)$/)) {
    return next();
  }

  res.sendFile(path.join(__dirname, '../public', 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
