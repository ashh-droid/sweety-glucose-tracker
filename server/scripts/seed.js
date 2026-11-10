'use strict';
const bcrypt = require('bcrypt');
const { getPool } = require('../src/lib/db');
const { localToday } = require('../src/lib/dates');
(async () => {
  const pool = getPool();
  const email = process.env.SEED_EMAIL || 'demo@sweety.local';
  const password = process.env.SEED_PASSWORD || 'Demo12345!';
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ('Demo Patient', $1, $2)
     ON CONFLICT (email) DO UPDATE SET name='Demo Patient', password_hash=EXCLUDED.password_hash
     RETURNING id`, [email, hash]
  );
  const userId = rows[0].id;
  const today = localToday(process.env.APP_TIMEZONE || 'Asia/Kolkata');
  const date = new Date(`${today}T00:00:00Z`);
  const examples = [
    [0, 'morning_fasting', 94], [0, 'after_breakfast', 128], [0, 'after_lunch', 137], [0, 'after_dinner', 121],
    [-1, 'morning_fasting', 99], [-1, 'after_breakfast', 124], [-1, 'after_dinner', 118],
    [-5, 'morning_fasting', 92], [-5, 'after_lunch', 132], [-35, 'morning_fasting', 104], [-35, 'after_dinner', 146]
  ];
  for (const [daysAgo, slot, value] of examples) {
    const day = new Date(date.getTime() + daysAgo * 86400000).toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value_mgdl) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, reading_date, slot) DO UPDATE SET value_mgdl=EXCLUDED.value_mgdl`,
      [userId, day, slot, value]
    );
  }
  console.log(`Demo data ready: ${email} / ${password} (local development only).`);
  await pool.end();
})().catch((error) => { console.error('Seed failed:', error.message); process.exit(1); });
