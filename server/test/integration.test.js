'use strict';
// PostgreSQL-backed HTTP tests: run with TEST_DATABASE_URL pointing to a
// disposable DB named *_test. Never run this suite against user data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('API integration: auth, validation, isolation, CRUD and reports', {
  skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to a separate test database'
}, async (t) => {
  const testUrl = new URL(process.env.TEST_DATABASE_URL);
  if (!testUrl.pathname.endsWith('_test')) throw new Error('Safety check: test database name must end in _test');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'local-test-secret-longer-than-thirty-two-characters';
  process.env.NODE_ENV = 'test';
  process.env.APP_TIMEZONE = 'Asia/Kolkata';

  const bcrypt = require('bcrypt');
  const { getPool } = require('../src/lib/db');
  const pool = getPool();
  const request = require('supertest');
  const app = require('../src/app');
  await pool.query(fs.readFileSync(path.resolve(__dirname, '../db/schema.sql'), 'utf8'));

  const suffix = `${Date.now()}-${process.pid}`;
  const emailA = `test-a-${suffix}@example.test`;
  const emailB = `test-b-${suffix}@example.test`;
  const agentA = request.agent(app);
  const agentB = request.agent(app);
  const date = '2026-10-15';
  const postReading = (agent, slot, value, readingDate = date) => agent.post('/api/readings').send({ date: readingDate, slot, value });

  let first, second;
  try {
    await t.test('Authentication, hashing and session safety', async () => {
    // Registration, hashing, duplicate account, invalid credentials and session.
    const registration = await agentA.post('/api/auth/register').send({ name: 'Patient A', email: emailA, password: 'strong-password-123' });
    assert.equal(registration.status, 201, JSON.stringify(registration.body));
    assert.equal((await agentB.post('/api/auth/register').send({ name: 'Patient B', email: emailB, password: 'strong-password-123' })).status, 201);
    const duplicateAccount = await request(app).post('/api/auth/register').send({ name: 'Patient A', email: emailA, password: 'strong-password-123' });
    assert.equal(duplicateAccount.status, 409);
    const hashResult = await pool.query('SELECT password_hash FROM users WHERE email = $1', [emailA]);
    assert.notEqual(hashResult.rows[0].password_hash, 'strong-password-123');
    assert.equal(await bcrypt.compare('strong-password-123', hashResult.rows[0].password_hash), true);
    assert.equal((await request(app).post('/api/auth/login').send({ email: emailA, password: 'incorrect-password' })).status, 401);
    assert.equal((await agentA.get('/api/auth/me')).body.user.email, emailA);
    // Session checks are never counted against the login/register rate limiter.
    for (let i = 0; i < 27; i++) assert.equal((await agentA.get('/api/auth/me')).status, 200);
    assert.equal((await request(app).get('/api/readings')).status, 401);
    assert.equal((await request(app).get('/api/reports')).status, 401);

    });

    await t.test('Value validation and duplicate-slot protection', async () => {
    // Required validation order and exact responses.
    const missing = await agentA.post('/api/readings').send({ date, slot: 'after_lunch' });
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error, 'Please enter a glucose value.');
    for (const value of [39, 601, 100.5, 'invalid']) {
      const invalid = await postReading(agentA, 'after_lunch', value);
      assert.equal(invalid.status, 400);
      assert.equal(invalid.body.error, 'Value must be between 40 and 600 mg/dl.');
    }
    const future = await postReading(agentA, 'after_lunch', 123, '2099-01-01');
    assert.equal(future.status, 400);
    assert.equal(future.body.error, 'Date cannot be in the future.');

    first = await postReading(agentA, 'morning_fasting', 100);
    assert.equal(first.status, 201);
    second = await postReading(agentA, 'after_lunch', 141);
    assert.equal(second.status, 201);
    const duplicateSlot = await postReading(agentA, 'after_lunch', 150);
    assert.equal(duplicateSlot.status, 400);
    assert.equal(duplicateSlot.body.error, 'You already have an After lunch reading for this date.');
    const duplicateFasting = await postReading(agentA, 'morning_fasting', 120);
    assert.equal(duplicateFasting.body.error, 'You already have a Morning (fasting) reading for this date.');
    // Editing must exclude the original row when counting a slot as occupied.
    const editToTakenSlot = await agentA.put(`/api/readings/${first.body.reading.id}`).send({ slot: 'after_lunch' });
    assert.equal(editToTakenSlot.status, 400);
    assert.equal(editToTakenSlot.body.error, 'You already have an After lunch reading for this date.');

    });

    await t.test('Daily reports, month diary and account isolation', async () => {
    const initialReport = await agentA.get(`/api/reports?date=${date}`);
    assert.equal(initialReport.status, 200);
    assert.deepEqual(initialReport.body.daily.readings.map((r) => r.slot), ['morning_fasting', 'after_lunch']);
    assert.equal(initialReport.body.daily.count, 2);
    assert.equal(initialReport.body.daily.lowest, 100);
    assert.equal(initialReport.body.daily.highest, 141);
    assert.equal(initialReport.body.daily.average, 120.5);
    assert.equal(initialReport.body.daily.inRangeCount, 2);
    assert.equal(initialReport.body.monthToDate.inRangeCount, 2);
    assert.equal(initialReport.body.previousMonth.inRangeCount, 0);
    assert.equal(initialReport.body.previousMonthComparable.range.from, '2026-09-01');
    assert.equal(initialReport.body.previousMonthComparable.count, 0);
    const monthDiary = await agentA.get('/api/readings/month?month=2026-10');
    assert.equal(monthDiary.status, 200);
    assert.equal(monthDiary.body.readings.length, 2);
    assert.deepEqual(monthDiary.body.readings.map((r) => r.slot), ['morning_fasting', 'after_lunch']);
    assert.equal((await agentB.get('/api/readings/month?month=2026-10')).body.readings.length, 0);
    assert.equal((await agentA.get('/api/readings/month?month=2026-13')).status, 400);
    assert.deepEqual(initialReport.body.monthToDate.range, { from: '2026-10-01', to: date });
    assert.deepEqual(initialReport.body.previousMonth.range, { from: '2026-09-01', to: '2026-09-30' });
    assert.equal(initialReport.body.previousMonth.count, 0);
    assert.equal(initialReport.body.previousMonth.average, null);
    assert.equal((await agentB.get(`/api/reports?date=${date}`)).body.daily.count, 0);
    assert.equal((await agentB.get(`/api/readings?date=${date}`)).body.readings.length, 0);

    });

    await t.test('Ownership checks, updates and pagination', async () => {
    // Cross-user isolation includes read, edit, and delete.
    assert.equal((await agentB.put(`/api/readings/${first.body.reading.id}`).send({ value: 250 })).status, 404);
    assert.equal((await agentB.delete(`/api/readings/${first.body.reading.id}`)).status, 404);
    assert.equal((await agentA.patch(`/api/readings/${first.body.reading.id}`).send({ value: 110 })).status, 200);
    const recent = await agentA.get('/api/readings?page=1&limit=1');
    assert.equal(recent.status, 200);
    assert.equal(recent.body.readings.length, 1);
    assert.equal(recent.body.pagination.total, 2);

    });

    await t.test('Four-slot limit and edits on a full day', async () => {
    // Once four slots exist, the daily-cap error takes precedence over duplicate.
    assert.equal((await postReading(agentA, 'after_breakfast', 125)).status, 201);
    assert.equal((await postReading(agentA, 'after_dinner', 130)).status, 201);
    const fifth = await postReading(agentA, 'morning_fasting', 150);
    assert.equal(fifth.status, 400);
    assert.equal(fifth.body.error, 'You can add only 4 readings per day.');
    // Editing in-place remains valid even with 4 slots already occupied.
    const ownEdit = await agentA.put(`/api/readings/${first.body.reading.id}`).send({ value: 115 });
    assert.equal(ownEdit.status, 200);
    assert.equal(ownEdit.body.reading.value, 115);

    });

    await t.test('Previous-month reports, deletion and logout', async () => {
    // Previous calendar-month aggregation, not rolling 30 days.
    assert.equal((await postReading(agentA, 'morning_fasting', 99, '2026-09-15')).status, 201);
    const monthly = await agentA.get(`/api/reports?date=${date}`);
    assert.equal(monthly.body.previousMonth.count, 1);
    assert.equal(monthly.body.previousMonth.average, 99);
    assert.equal((await agentA.delete(`/api/readings/${first.body.reading.id}`)).status, 204);
    assert.equal((await agentA.get(`/api/reports?date=${date}`)).body.daily.count, 3);
    assert.equal((await agentA.post('/api/auth/logout')).status, 200);
    assert.equal((await agentA.get('/api/auth/me')).status, 401);
    assert.equal((await agentA.post('/api/auth/login').send({ email: emailA, password: 'strong-password-123' })).status, 200);
    });
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [[emailA, emailB]]);
    await pool.end();
  }
});
