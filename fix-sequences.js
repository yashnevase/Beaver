const db = require('./src/models');

const fixSequences = async () => {
  try {
    const [results] = await db.sequelize.query(`
      SELECT 'SELECT setval(' || quote_literal(quote_ident(s.relname)) || ', COALESCE(MAX(' || quote_ident(c.attname) || '), 1)) FROM ' || quote_ident(t.relname) || ';' AS query
      FROM pg_class AS s
      JOIN pg_depend AS d ON d.objid = s.oid
      JOIN pg_class AS t ON d.refobjid = t.oid
      JOIN pg_attribute AS c ON d.refobjid = c.attrelid AND d.refobjsubid = c.attnum
      WHERE s.relkind = 'S' AND d.deptype = 'a';
    `);

    console.log('Found sequences to fix:', results.length);

    for (const row of results) {
      console.log('Executing:', row.query);
      await db.sequelize.query(row.query);
    }

    console.log('All sequences synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing sequences:', error);
    process.exit(1);
  }
};

fixSequences();
