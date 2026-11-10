import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestedSlot } from './suggestion.js';

test('suggested slot follows configured local clock, not UTC', () => {
  assert.equal(suggestedSlot(new Date('2026-11-10T03:00:00Z')), 'morning_fasting');
  assert.equal(suggestedSlot(new Date('2026-11-10T05:00:00Z')), 'after_breakfast');
  assert.equal(suggestedSlot(new Date('2026-11-10T08:00:00Z')), 'after_lunch');
  assert.equal(suggestedSlot(new Date('2026-11-10T13:00:00Z')), 'after_dinner');
});
