import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyAverage } from './history.js';

test('day average uses all available slots, including high readings', () => {
  assert.equal(dailyAverage([{value:104}, {value:128}, {value:192}]), '141.3');
});
test('day average is absent when no readings exist', () => {
  assert.equal(dailyAverage([]), null);
});
test('day average returns one decimal for a single reading', () => {
  assert.equal(dailyAverage([{value:99}]), '99.0');
});
