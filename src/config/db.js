const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'beaver_dev',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: (sql, timing) => {
      if (process.env.ENABLE_SLOW_QUERY_LOG === 'true' && timing > 500) {
        logger.warn(`Slow query (${timing}ms): ${sql.substring(0, 200)}`);
      }
    },
    benchmark: true,
    pool: {
      max: process.env.NODE_ENV === 'production' ? 50 : 10,
      min: process.env.NODE_ENV === 'production' ? 5 : 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✓ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('✗ Database connection failed:', error);
    return false;
  }
};

const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;
module.exports.testConnection = testConnection;
module.exports.closeConnection = closeConnection;
