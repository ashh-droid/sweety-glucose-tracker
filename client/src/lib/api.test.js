import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, prettyDate } from './api.js';

test('frontend date follows app timezone, even when it is yesterday in UTC', () => {
  assert.equal(localDate(new Date('2026-11-09T22:30:00Z')), '2026-11-10');
  assert.equal(localDate(new Date('2026-11-09T02:30:00Z')), '2026-11-09');
});

test('frontend formats date-only strings without UTC conversion', () => {
  assert.equal(prettyDate('2026-10-15'), '15 Oct 2026');
});
