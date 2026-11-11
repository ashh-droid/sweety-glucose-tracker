'use strict';
const express = require('express');
const { getPool } = require('../lib/db');
const { isValidDate, localToday } = require('../lib/dates');
const { validateReading, SLOT_LABELS } = require('../lib/validation');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

const columns = 'id, reading_date AS date, slot, value_mgdl AS value, created_at, updated_at';
const ordering = `ORDER BY reading_date DESC, CASE slot
  WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2
  WHEN 'after_lunch' THEN 3 ELSE 4 END`;
const today = () => localToday(process.env.APP_TIMEZONE || 'Asia/Kolkata');
// Bound route IDs before passing them to PostgreSQL BIGINT parameters.
const validReadingId = (id) => /^\d{1,18}$/.test(id);
const article = (label) => label?.startsWith('Morning') ? 'a' : 'an';
const duplicateMessage = (slot) => {
  const label = SLOT_LABELS[slot] || 'existing slot';
  return `You already have ${article(label)} ${label} reading for this date.`;
};

function dbError(res, error, slot) {
  if (error.code === '23505') {
    return res.status(400).json({ error: duplicateMessage(slot) });
  }
  if (error.code === '23514') return res.status(400).json({ error: 'Invalid reading value or time slot.' });
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date;
    if (date !== undefined && !isValidDate(date)) {
      return res.status(400).json({ error: 'Please enter a valid date.' });
    }
    // Optional pagination supports the bonus task; date filtering powers the dashboard.
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Page must be positive and limit must be between 1 and 100.' });
    }
    const where = date ? 'WHERE user_id = $1 AND reading_date = $2' : 'WHERE user_id = $1';
    const params = date ? [req.userId, date] : [req.userId];
    const [result, count] = await Promise.all([
      getPool().query(`SELECT ${columns} FROM readings ${where} ${ordering} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
      getPool().query(`SELECT COUNT(*)::int AS total FROM readings ${where}`, params)
    ]);
    res.json({ readings: result.rows, pagination: { page, limit, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / limit) } });
  } catch (error) { next(error); }
});

// Cursor pagination returns complete calendar days, never partial four-slot days.
// A single user-scoped query fetches one additional day to detect more history.
router.get('/days', async (req, res, next) => {
  const { before } = req.query;
  if (before !== undefined && (typeof before !== 'string' || !isValidDate(before))) {
    return res.status(400).json({ error: 'Please enter a valid before date.' });
  }
  const limit = req.query.limit === undefined ? 7 : Number(req.query.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 30) {
    return res.status(400).json({ error: 'Limit must be a whole number between 1 and 30 days.' });
  }
  try {
    const { rows } = await getPool().query(
      `WITH selected_days AS (
         SELECT reading_date
         FROM readings
         WHERE user_id = $1 AND ($2::date IS NULL OR reading_date < $2::date)
         GROUP BY reading_date
         ORDER BY reading_date DESC
         LIMIT $3
       )
       SELECT r.id, r.reading_date AS date, r.slot, r.value_mgdl AS value
       FROM selected_days AS d
       JOIN readings AS r ON r.user_id = $1 AND r.reading_date = d.reading_date
       ORDER BY d.reading_date DESC, CASE r.slot
         WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3 ELSE 4 END`,
      [req.userId, before ?? null, limit + 1]
    );
    const grouped = [];
    for (const reading of rows) {
      if (grouped.at(-1)?.date !== reading.date) {
        grouped.push({ date: reading.date, readings: [] });
      }
      grouped.at(-1).readings.push(reading);
    }
    const hasMore = grouped.length > limit;
    const days = grouped.slice(0, limit);
    res.json({ days, hasMore, nextBefore: hasMore ? days.at(-1).date : null });
  } catch (error) { next(error); }
});

// A dedicated, bounded month query powers the printable paper-diary view.
// Every row remains scoped to the user from the authenticated session.
router.get('/month', async (req, res, next) => {
  const month = req.query.month;
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: 'Please select a valid month.' });
  }
  const [year, number] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10);
  try {
    const { rows } = await getPool().query(
      `SELECT ${columns} FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date < $3
       ORDER BY reading_date ASC, CASE slot
         WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3 ELSE 4 END`,
      [req.userId, from, to]
    );
    res.json({ month, readings: rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  const { errors, data } = validateReading(req.body || {}, today());
  if (errors.length) return res.status(400).json({ error: errors[0] });
  try {
    const existing = await getPool().query(
      'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2',
      [req.userId, data.date]
    );
    // Both validations are explicit even though four slots + UNIQUE already cap the total.
    // Explicit check first: when all four slots are filled, report the daily cap.
    if (existing.rows.length >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }
    if (existing.rows.some((row) => row.slot === data.slot)) {
      return res.status(400).json({ error: duplicateMessage(data.slot) });
    }
    const result = await getPool().query(
      `INSERT INTO readings (user_id, reading_date, slot, value_mgdl)
       VALUES ($1,$2,$3,$4) RETURNING ${columns}`,
      [req.userId, data.date, data.slot, data.value]
    );
    res.status(201).json({ reading: result.rows[0] });
  } catch (error) {
    if (!dbError(res, error, data.slot)) next(error);
  }
});

async function updateReading(req, res, next) {
  let requestedSlot;
  if (!validReadingId(req.params.id)) return res.status(400).json({ error: 'Invalid reading ID.' });
  try {
    const original = await getPool().query(
      `SELECT ${columns} FROM readings WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId]
    );
    if (!original.rows.length) return res.status(404).json({ error: 'Reading not found.' });
    const existing = original.rows[0];
    const { errors, data } = validateReading({
      date: Object.hasOwn(req.body || {}, 'date') ? req.body.date : existing.date,
      slot: Object.hasOwn(req.body || {}, 'slot') ? req.body.slot : existing.slot,
      value: Object.hasOwn(req.body || {}, 'value') ? req.body.value : existing.value
    }, today());
    if (errors.length) return res.status(400).json({ error: errors[0] });
    requestedSlot = data.slot;
    const occupants = await getPool().query(
      'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
      [req.userId, data.date, req.params.id]
    );
    if (occupants.rows.length >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }
    if (occupants.rows.some((row) => row.slot === data.slot)) {
      return res.status(400).json({ error: duplicateMessage(data.slot) });
    }
    const updated = await getPool().query(
      `UPDATE readings SET reading_date=$1, slot=$2, value_mgdl=$3, updated_at=now()
       WHERE id=$4 AND user_id=$5 RETURNING ${columns}`,
      [data.date, data.slot, data.value, req.params.id, req.userId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: 'Reading not found.' });
    res.json({ reading: updated.rows[0] });
  } catch (error) {
    if (!dbError(res, error, requestedSlot)) next(error);
  }
}
// PUT is provided for conventional REST clients; PATCH supports partial edits.
router.put('/:id', updateReading);
router.patch('/:id', updateReading);

router.delete('/:id', async (req, res, next) => {
  if (!validReadingId(req.params.id)) return res.status(400).json({ error: 'Invalid reading ID.' });
  try {
    const result = await getPool().query('DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});
module.exports = router;
