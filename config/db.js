const pg = require("pg");

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  port: 5432,
  password: process.env.DB_PASSWORD,
  database: "dodofiles_db",
});

module.exports = pool;
