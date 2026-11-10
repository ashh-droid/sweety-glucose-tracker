'use strict';

const { isValidDate, localToday } = require('./dates');
const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner'
};

// Error precedence follows the assignment: missing value, range, future date,
// then slot validation. Database-dependent checks happen after these.
function validateReading(body, today = localToday(process.env.APP_TIMEZONE || 'Asia/Kolkata')) {
  const errors = [];
  if (body.value === undefined || body.value === null || body.value === '') {
    errors.push('Please enter a glucose value.');
  } else {
    const isWhole = (typeof body.value === 'number' && Number.isSafeInteger(body.value)) ||
      (typeof body.value === 'string' && /^\d+$/.test(body.value.trim()));
    if (!isWhole || Number(body.value) < 40 || Number(body.value) > 600) {
      errors.push('Value must be between 40 and 600 mg/dl.');
    }
  }
  if (!isValidDate(body.date)) errors.push('Please enter a valid date.');
  else if (body.date > today) errors.push('Date cannot be in the future.');
  if (!SLOTS.includes(body.slot)) errors.push('Please choose a valid time slot.');
  return { errors, data: { date: body.date, slot: body.slot, value: Number(body.value) } };
}

function validateAccount(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = [];
  if (name.length < 2 || name.length > 80) errors.push('Name must be 2–80 characters.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) errors.push('Password must be 8–72 bytes.');
  return { errors, name, email, password };
}

module.exports = { SLOTS, SLOT_LABELS, validateReading, validateAccount };
