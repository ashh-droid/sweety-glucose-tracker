'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { Pool, types } = require('pg');
// Preserve date-only values as YYYY-MM-DD strings; no timezone conversion.
types.setTypeParser(1082, (value) => value);

let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; see .env.example');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
module.exports = { getPool };
