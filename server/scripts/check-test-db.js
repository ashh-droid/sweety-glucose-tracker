'use strict';
// Integration tests must never modify a development or production database.
const connection = process.env.TEST_DATABASE_URL;
if (!connection) {
  console.error('TEST_DATABASE_URL is required. Use a dedicated database ending in _test.');
  process.exit(1);
}
let database;
try { database = decodeURIComponent(new URL(connection).pathname.slice(1)); }
catch { console.error('TEST_DATABASE_URL must be a valid PostgreSQL connection URL.'); process.exit(1); }
if (!database.endsWith('_test')) {
  console.error('Refusing to run: test database name must end in _test.');
  process.exit(1);
}
