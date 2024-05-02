const pg = require('pg')

const pool = new pg.Pool({
    host: 'localhost',
    user: 'postgres',
    port: 5432,
    password: 'postgre123',
    database: 'dodofiles_db',
  });

module.exports = pool;