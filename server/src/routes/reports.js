'use strict';
const express = require('express');
const { getPool } = require('../lib/db');
const { isValidDate, localToday, getRange } = require('../lib/dates');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

async function summary(userId, range) {
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS count, MIN(value_mgdl) AS lowest,
     MAX(value_mgdl) AS highest, ROUND(AVG(value_mgdl)::numeric, 1) AS average,
     COUNT(*) FILTER (WHERE value_mgdl BETWEEN 70 AND 180)::int AS in_range_count
     FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, range.from, range.to]
  );
  const record = rows[0];
  return { range, count: record.count, inRangeCount: record.in_range_count, lowest: record.lowest, highest: record.highest,
    average: record.average === null ? null : Number(record.average) };
}

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || localToday(process.env.APP_TIMEZONE || 'Asia/Kolkata');
    if (!isValidDate(date)) return res.status(400).json({ error: 'Please select a valid report date.' });
    const dailyRange = getRange('daily', date);
    const previous = getRange('monthly', date);
    const previousMonthEndDay = Number(previous.to.slice(-2));
    const comparableDay = Math.min(Number(date.slice(-2)), previousMonthEndDay);
    const comparablePrevious = { from: previous.from, to: previous.from.slice(0, 8) + String(comparableDay).padStart(2, '0') };
    const [daily, monthToDate, previousMonth, previousMonthComparable, dailyRows] = await Promise.all([
      summary(req.userId, dailyRange),
      summary(req.userId, getRange('monthToDate', date)),
      summary(req.userId, previous),
      summary(req.userId, comparablePrevious),
      getPool().query(
        `SELECT id, reading_date AS date, slot, value_mgdl AS value
         FROM readings WHERE user_id = $1 AND reading_date = $2
         ORDER BY CASE slot WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2
                  WHEN 'after_lunch' THEN 3 ELSE 4 END`,
        [req.userId, date]
      )
    ]);
    res.json({ selectedDate: date, daily: { ...daily, readings: dailyRows.rows }, monthToDate, previousMonth, previousMonthComparable });
  } catch (error) { next(error); }
});
module.exports = router;
