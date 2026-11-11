import test from 'node:test';
import assert from 'node:assert/strict';
import { glucoseValueError } from './readingValidation.js';

test('empty glucose values show the required message before an API call', () => {
  for (const value of ['', null, undefined]) {
    assert.equal(glucoseValueError(value), 'Please enter a glucose value.');
  }
});

test('inclusive range boundaries are accepted', () => {
  for (const value of ['40', '600', 40, 600]) {
    assert.equal(glucoseValueError(value), null);
  }
});

test('out-of-range values display the exact assignment error', () => {
  for (const value of ['39', '700', 601, '-1']) {
    assert.equal(glucoseValueError(value), 'Value must be between 40 and 600 mg/dl.');
  }
});

test('decimals and non-numeric values are rejected before an API call', () => {
  for (const value of ['40.5', '1e2', 'oops', ' ', NaN]) {
    assert.equal(glucoseValueError(value), 'Value must be between 40 and 600 mg/dl.');
  }
});

test('valid browser strings including trimmed and zero-padded values work', () => {
  for (const value of [' 120 ', '0040', '180']) {
    assert.equal(glucoseValueError(value), null);
  }
});
