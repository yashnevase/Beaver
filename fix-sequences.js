const db = require('./src/models');

const fixSequences = async () => {
  try {
    // Better query using information_schema to find table-column-sequence triplets
    const [results] = await db.sequelize.query(`
      SELECT 
        table_name as "tableName",
        column_name as "columnName",
        replace(replace(column_default, 'nextval(''', ''), '''::regclass)', '') as "sequenceName"
      FROM information_schema.columns 
      WHERE column_default LIKE 'nextval%'
      AND table_schema = 'public';
    `);

    console.log('Found sequences to check:', results.length);

    for (const row of results) {
      try {
        // Double check if column exists by trying a simple SELECT
        const query = `SELECT setval('${row.sequenceName}', COALESCE(MAX(${row.columnName}), 1)) FROM ${row.tableName};`;
        console.log('Synchronizing:', row.tableName, '(', row.columnName, ')');
        await db.sequelize.query(query);
      } catch (err) {
        console.warn(`Skipping sequence for ${row.tableName}.${row.columnName}: ${err.message}`);
      }
    }

    console.log('Sequence synchronization completed.');
    process.exit(0);
  } catch (error) {
    console.error('Critical error in sequence fixer:', error);
    process.exit(1);
  }
};

fixSequences();
