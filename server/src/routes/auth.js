'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const { getPool } = require('../lib/db');
const { validateAccount } = require('../lib/validation');
const { COOKIE_NAME, COOKIE_OPTIONS, requireAuth, signSession } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { errors, name, email, password } = validateAccount(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors[0] });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await getPool().query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.cookie(COOKIE_NAME, signSession(rows[0].id), COOKIE_OPTIONS);
    return res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
    const { rows } = await getPool().query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]
    );
    const valid = rows.length === 1 && await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    const { id, name } = rows[0];
    res.cookie(COOKIE_NAME, signSession(id), COOKIE_OPTIONS);
    return res.json({ user: { id, name, email } });
  } catch (error) { next(error); }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'strict', secure: COOKIE_OPTIONS.secure });
  res.json({ message: 'Logged out.' });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await getPool().query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows.length) return res.status(401).json({ error: 'Account not found.' });
    return res.json({ user: rows[0] });
  } catch (error) { next(error); }
});
module.exports = router;
