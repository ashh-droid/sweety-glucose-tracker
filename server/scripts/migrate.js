'use strict';
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/lib/db');
(async () => {
  const pool = getPool();
  await pool.query(fs.readFileSync(path.resolve(__dirname, '../db/schema.sql'), 'utf8'));
  console.log('Database tables and indexes ready.');
  await pool.end();
})().catch((error) => { console.error('Migration failed:', error.message); process.exit(1); });
