'use strict';
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'sweety_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};
function signSession(userId) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace_')) {
    throw new Error('Set JWT_SECRET to a unique value of at least 32 characters in .env');
  }
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!/^\d+$/.test(String(payload.sub))) throw new Error('Invalid token subject');
    req.userId = String(payload.sub);
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
module.exports = { COOKIE_NAME, COOKIE_OPTIONS, requireAuth, signSession };
