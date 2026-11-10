import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleDates, monthRows, weekdayDate } from './monthGrid.js';

test('current month only shows days through the selected local today', () => {
  assert.equal(visibleDates('2026-11', '2026-11-11').length, 11);
  assert.equal(visibleDates('2026-11', '2026-11-11').at(-1), '2026-11-11');
});
test('past month shows the complete month including leap February', () => {
  assert.equal(visibleDates('2024-02', '2026-11-11').length, 29);
  assert.equal(visibleDates('2026-10', '2026-11-11').length, 31);
});
test('future months produce no editable days', () => {
  assert.deepEqual(visibleDates('2026-12', '2026-11-11'), []);
});
test('groups empty stretches but preserves today's individual row', () => {
  const dates = visibleDates('2026-11', '2026-11-11');
  const groups = monthRows(dates, [{date:'2026-11-05',slot:'after_lunch'}], '2026-11-11');
  assert.equal(groups[0].type, 'empty');
  assert.equal(groups[0].dates.length, 4);
  assert.equal(groups[1].type, 'day');
  assert.deepEqual(groups.at(-1).dates, ['2026-11-11']);
});
test('short empty stretches are not collapsed', () => {
  const groups = monthRows(['2026-11-01','2026-11-02'], [], '2026-11-11');
  assert.deepEqual(groups.map((r) => r.type), ['day', 'day']);
});
test('weekday labels use calendar dates, not local timezone shifts', () => {
  assert.equal(weekdayDate('2026-11-05'), 'Th 5');
});
