require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'beaver_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { 
        require: true,
        rejectUnauthorized: false 
      } : false,
      // Force IPv4 to prevent ENETUNREACH on environments with limited IPv6 support
      family: 4
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'beaver_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    pool: {
      max: 50,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { 
        require: true,
        rejectUnauthorized: false 
      } : false,
      // Force IPv4 to prevent ENETUNREACH on environments with limited IPv6 support
      family: 4
    }
  }
};
