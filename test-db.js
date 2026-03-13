const { Sequelize } = require('sequelize');
require('dotenv').config();

async function test() {
  const user = 'postgres';
  const pass = 'Be@ver#20262075';
  const host = 'db.ysbgupygbkwnxmhufdxi.supabase.co';
  
  console.log('Testing connection to DIRECT host:', host);
  
  const sequelize = new Sequelize('postgres', user, pass, {
    host: host,
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      // family: 4 // Usually direct is IPv6 ONLY, so family 4 might fail if we HAVE IPv6
    },
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('SUCCESS: Connection established to DIRECT host.');
  } catch (error) {
    console.error('FAILURE to DIRECT host:', error.message);
  } finally {
    await sequelize.close();
  }
}

test();
