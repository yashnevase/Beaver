const { Sequelize } = require('sequelize');
require('dotenv').config();

async function test() {
  console.log('--- Testing NEW Singapore Pooler (Port 5432) ---');
  
  const pass = 'Be%40ver%2320262075';
  const url = `postgres://postgres.ysbgupygbkwnxmhufdxi:${pass}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;
  
  const sequelize = new Sequelize(url, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      family: 4
    },
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('SUCCESS! This is the correct connection.');
    console.log('Use this URL on Render:', url);
    return;
  } catch (error) {
    console.log('FAILED:', error.message);
  } finally {
    await sequelize.close();
  }
}

test();
