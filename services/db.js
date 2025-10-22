const { Pool } = require('pg');

const pool = new Pool({
  user: 'administrationSTS',
  host: 'avo-adb-002.postgres.database.azure.com',
  database: 'Client_DB',
  password: 'St$@0987',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Required for Azure
  },
});

module.exports = pool;
