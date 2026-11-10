'use strict';

function localToday(timeZone = 'Asia/Kolkata', now = new Date()) {
  const pieces = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = (name) => pieces.find((p) => p.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function previousMonthRange(date) {
  if (!isValidDate(date)) throw new Error('Invalid report date');
  const [year, month] = date.split('-').map(Number);
  const firstPrev = new Date(Date.UTC(year, month - 2, 1));
  const lastPrev = new Date(Date.UTC(year, month - 1, 0));
  return { from: firstPrev.toISOString().slice(0, 10), to: lastPrev.toISOString().slice(0, 10) };
}

function monthToDateRange(date) {
  if (!isValidDate(date)) throw new Error('Invalid report date');
  return { from: `${date.slice(0, 7)}-01`, to: date };
}

function getRange(type, date) {
  if (!isValidDate(date)) throw new Error('Invalid report date');
  if (type === 'daily') return { from: date, to: date };
  if (type === 'monthToDate') return monthToDateRange(date);
  if (type === 'monthly') return previousMonthRange(date);
  throw new Error('Unknown report type');
}

module.exports = { localToday, isValidDate, previousMonthRange, monthToDateRange, getRange };
