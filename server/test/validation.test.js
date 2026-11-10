'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidDate, previousMonthRange, monthToDateRange, getRange, localToday } = require('../src/lib/dates');
const { validateReading, validateAccount, SLOTS } = require('../src/lib/validation');

const TODAY = '2026-11-10';
const valid = { date: '2026-11-09', slot: 'after_lunch', value: 113 };
const result = (changes) => validateReading({ ...valid, ...changes }, TODAY);

test('all four prescribed time slots are accepted', () => {
  assert.equal(SLOTS.length, 4);
  for (const slot of SLOTS) assert.deepEqual(result({ slot }).errors, []);
});
test('lower and upper boundaries are accepted', () => {
  assert.deepEqual(result({ value: 40 }).errors, []);
  assert.deepEqual(result({ value: 600 }).errors, []);
});
test('a numeric string from the browser is accepted', () => {
  assert.deepEqual(result({ value: '140' }).errors, []);
  assert.equal(result({ value: '140' }).data.value, 140);
});
test('missing values get the exact required error', () => {
  for (const value of ['', null, undefined]) assert.equal(result({ value }).errors[0], 'Please enter a glucose value.');
});
test('values outside 40 to 600 are rejected', () => {
  for (const value of [39, 601, 0, -4, '1000']) assert.match(result({ value }).errors[0], /40 and 600/);
});
test('decimals, NaN, and non-numeric strings are rejected', () => {
  for (const value of [101.5, '100.0', '1e2', 'abc', NaN]) assert.equal(result({ value }).errors[0], 'Value must be between 40 and 600 mg/dl.');
});
test('future readings are rejected', () => {
  assert.deepEqual(result({ date: '2026-11-11' }).errors, ['Date cannot be in the future.']);
});
test('today is accepted', () => {
  assert.deepEqual(result({ date: TODAY }).errors, []);
});
test('malformed dates and nonexistent leap days are rejected', () => {
  for (const date of ['2026-02-29', '2026-11-31', '2026-13-01', '2026-1-01', 'xx']) {
    assert.equal(isValidDate(date), false);
    assert.match(result({ date }).errors[0], /valid date/);
  }
  assert.equal(isValidDate('2024-02-29'), true);
});
test('invalid slot is rejected', () => {
  assert.match(result({ slot: 'late_night' }).errors[0], /valid time slot/);
});
test('month to date is the first through selected date', () => {
  assert.deepEqual(monthToDateRange('2026-10-15'), { from: '2026-10-01', to: '2026-10-15' });
});
test('previous month is a whole calendar month, not last 30 days', () => {
  assert.deepEqual(previousMonthRange('2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
  assert.deepEqual(previousMonthRange('2026-01-02'), { from: '2025-12-01', to: '2025-12-31' });
  assert.deepEqual(previousMonthRange('2024-03-01'), { from: '2024-02-01', to: '2024-02-29' });
});
test('local today is determined from chosen timezone', () => {
  const instant = new Date('2026-11-09T22:30:00.000Z');
  assert.equal(localToday('Asia/Kolkata', instant), '2026-11-10');
  assert.equal(localToday('UTC', instant), '2026-11-09');
});
test('account validation accepts a valid application', () => {
  const result = validateAccount({ name: '  Asmita  ', email: '  ASMITA@Example.COM  ', password: 'correcthorsebattery' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.name, 'Asmita');
  assert.equal(result.email, 'asmita@example.com');
});
test('account validation rejects weak credentials', () => {
  const result = validateAccount({ name: 'A', email: 'bad', password: 'short' });
  assert.equal(result.errors.length, 3);
});

test('validation priority reports missing or out-of-range value before date and slot problems', () => {
  assert.equal(result({ value: '', date: '2026-11-12', slot: 'wrong' }).errors[0], 'Please enter a glucose value.');
  assert.equal(result({ value: 601, date: '2026-11-12' }).errors[0], 'Value must be between 40 and 600 mg/dl.');
  assert.equal(result({ date: '2026-11-12', slot: 'wrong' }).errors[0], 'Date cannot be in the future.');
});
test('getRange handles daily, month-to-date and previous month including year rollover', () => {
  assert.deepEqual(getRange('daily', '2026-11-10'), { from: '2026-11-10', to: '2026-11-10' });
  assert.deepEqual(getRange('monthToDate', '2026-11-10'), { from: '2026-11-01', to: '2026-11-10' });
  assert.deepEqual(getRange('monthly', '2026-01-05'), { from: '2025-12-01', to: '2025-12-31' });
  assert.throws(() => getRange('yearly', '2026-11-10'), /Unknown report type/);
  assert.throws(() => getRange('daily', '2026-02-29'), /Invalid report date/);
});
