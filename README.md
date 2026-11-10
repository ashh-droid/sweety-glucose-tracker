# Sweety | Blood Glucose Tracker

A private, full-stack glucose reading journal built for the **Kenpath Junior Full Stack Developer – JavaScript & AI** engineering assignment.

**Stack:** React 18 + Vite, Node.js 20+ + Express, PostgreSQL 13+ (using `pg` and plain SQL), bcrypt, JWT in HTTP-only cookies, and Node.js built-in tests + Supertest. No MongoDB is needed: the assignment explicitly requires PostgreSQL.

> **Disclaimer:** Sweety is a logging and reporting demo, not a medical device. It does not provide diagnosis, treatment decisions, glucose targets, or medical advice. The sample data is fictional.

## Features

- Register with name, email, and password; log in/log out. Passwords are hashed with **bcrypt (cost 12)**, never stored in plaintext.
- HTTP-only, SameSite=Strict session cookie. All reading and reporting queries are scoped to the signed-in user's ID.
- Add, view, edit, and delete glucose readings (mg/dl), for the four assignment time slots.
- Both UI and API error messages for required values, whole-number range **40–600**, one entry per date/slot, maximum **4** entries per day, and future-date prevention.
- Database `UNIQUE(user_id, reading_date, slot)` and `CHECK` constraints protect data even if multiple requests arrive concurrently.
- Daily, **month-to-date**, and **previous full calendar month** reports: minimum, maximum, average (1 decimal), and count. The daily report lists each entry.
- Responsive logbook layout with four in-place entry boxes, print-friendly month diary, empty states, and loading/error feedback.
- **Bonus:** server-side pagination for `GET /api/readings?page=1&limit=20`, used in the reading-history panel. A user-scoped `GET /api/readings/month?month=YYYY-MM` serves the printable diary.
- A reusable seed script that creates or refreshes a demo account and sample readings.

## Prerequisites

- **Node.js 20 or newer** and npm.
- **PostgreSQL 13 or newer**, installed and running locally. (No Docker required.)

## Install and run

These commands are for a terminal opened at this repository's root. The default password in `.env.example` is only an illustrative local connection string; adapt it to your PostgreSQL credentials.

### 1. Create a PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE sweety;"
```

If the `psql` command is not in PATH on Windows, use SQL Shell (psql), or pgAdmin's **Create → Database**, naming it `sweety`.

### 2. Set environment variables

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and provide your real `DATABASE_URL` and a long, random `JWT_SECRET` (at least 32 characters). **Never commit `.env`.**

Example:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety
JWT_SECRET=replace_this_with_your_own_secure_random_secret_of_32_chars_or_more
PORT=4000
NODE_ENV=development
APP_TIMEZONE=Asia/Kolkata
```

For passwords containing special URL characters (`@`, `#`, `/`), URL-encode them in `DATABASE_URL`.

### 3. Install packages

```bash
npm install
```

### 4. Create database tables and seed the demo account

```bash
npm run db:migrate
npm run db:seed
```

The seed script is **repeatable** (`ON CONFLICT` updates the existing demo account's sample readings). Its local test credentials default to:

- **Email:** `demo@sweety.local`
- **Password:** `Demo12345!`

You may override these with `SEED_EMAIL` and `SEED_PASSWORD` in `.env`. **Do not run the seed script against production patient data.**

### 5. Start API and React UI

```bash
npm run dev
```

- **App:** http://localhost:5173
- **API health check:** http://localhost:4000/api/health
- The Vite development server proxies `/api` requests to port 4000, so cookies remain same-origin.

**Optional PostgreSQL-only Docker setup:** If you already use Docker, you may start a local database with `docker compose up -d postgres`. Then set `DATABASE_URL=postgresql://sweety:sweety_local_only@localhost:5432/sweety` in `.env`. Docker is **not required** for the assignment or for running Sweety locally.

To build the frontend and have Express serve it at port 4000:

```bash
npm run build
npm start
```

Use HTTPS and `NODE_ENV=production` behind a reverse proxy for deployments with real users. Do not deploy demo credentials. A public demo can use fictional readings and a separate test database.

## Running tests

```bash
npm test
```

The built-in Node test runner executes **26 standalone tests**: 17 API validation and date tests, 2 browser-side date tests, 6 month-grid tests, and 1 time suggestion test. They cover input boundaries, dates, report ranges, calendar grouping, future-day exclusion, and the approximate clock-based slot suggestion.

An additional **PostgreSQL + HTTP integration suite with six named subtests** verifies registration, cookie authentication, rate-limit scope, cross-user access restrictions, CRUD, duplicate protection, the month diary query, averages, pagination, and logout. It is skipped by default to avoid modifying your development database. To run it, create a **separate disposable test database** `sweety_test`, then set `TEST_DATABASE_URL`:

macOS/Linux:

```bash
TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test npm run test:integration
```

Windows PowerShell:

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test"
npm.cmd run test:integration
Remove-Item Env:TEST_DATABASE_URL
```

The integration test creates schema objects, inserts unique temporary accounts, and deletes those accounts afterward. It **refuses** to run unless the `TEST_DATABASE_URL` database name ends in `_test`. Use **only a dedicated test database**, never a live production database. The integration suite requires dependencies installed and a running PostgreSQL instance; if `TEST_DATABASE_URL` is not set, it is **skipped** (not counted as passed).

## API overview

| Method | Endpoint | Function |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register with `{name,email,password}`; set login cookie |
| `POST` | `/api/auth/login` | Log in with `{email,password}` |
| `GET` | `/api/auth/me` | Return current user's basic profile |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/readings?date=2026-10-15` | Read own entries for a date (optional date) |
| `GET` | `/api/readings?page=1&limit=20` | Paginated history (bonus) |
| `POST` | `/api/readings` | Create `{date,slot,value}` |
| `PATCH` / `PUT` | `/api/readings/:id` | Edit fields of an owned reading (excludes itself from duplicate check) |
| `DELETE` | `/api/readings/:id` | Delete an owned reading |
| `GET` | `/api/reports?date=2026-10-15` | Daily, month-to-date, previous-month summaries |

Four valid `slot` values are `morning_fasting`, `after_breakfast`, `after_lunch`, and `after_dinner`.

Example create request body:

```json
{
  "date": "2026-10-15",
  "slot": "after_lunch",
  "value": 128
}
```

Successful report response shape:

```json
{
  "selectedDate": "2026-10-15",
  "daily": {
    "range": { "from": "2026-10-15", "to": "2026-10-15" },
    "count": 2, "lowest": 100, "highest": 141, "average": 120.5,
    "readings": [
      { "id": "1", "date": "2026-10-15", "slot": "morning_fasting", "value": 100 },
      { "id": "2", "date": "2026-10-15", "slot": "after_lunch", "value": 141 }
    ]
  },
  "monthToDate": { "range": { "from": "2026-10-01", "to": "2026-10-15" }, "count": 2, "lowest": 100, "highest": 141, "average": 120.5 },
  "previousMonth": { "range": { "from": "2026-09-01", "to": "2026-09-30" }, "count": 0, "lowest": null, "highest": null, "average": null }
}
```

## Architecture

```text
client/                React, Vite, CSS, cookie-based API client
  src/components/      Login/register, date navigation, daily slots, report ledger, monthly diary and history
server/
  db/schema.sql        PostgreSQL users/readings schema & constraints
  src/lib/             Date helpers, input validation, pooled DB client
  src/middleware/      Signed session verification
  src/routes/          Auth, readings CRUD, summary reports
  scripts/             Migration and repeatable demo seeding
  test/                Fast unit tests and optional live-database integration tests
```

**Privacy and correctness:** passwords are bcrypt hashes; JWT is stored in a non-readable HTTP-only cookie; SQL uses parameter placeholders; `/readings` and `/reports` always filter on authenticated user ID. Report aggregation is done in PostgreSQL. `DATE` values are returned as date-only strings, avoiding UTC day rollover. The date-validation timezone defaults to `Asia/Kolkata` (`APP_TIMEZONE` on the server; keep the frontend `localDate` helper consistent if you change it).

## Notes | Assumptions and tradeoffs

- The phrase “MERN + PostgreSQL” in the assignment is interpreted as **React + Express + Node.js + PostgreSQL**, not MongoDB, because PostgreSQL is explicitly required.
- “Monthly” means the **whole previous calendar month** relative to the selected date (e.g. Oct 15 → Sep 1–30), not a rolling 30 days. “Month to date” begins on the first of the selected month.
- Only the **four specified slots** are valid. Their uniqueness also makes a fifth reading impossible; an additional API count check emits the explicit “4 readings” validation error when relevant.
- **Validation precedence:** required value → integer range (40–600) → future date (or invalid date) → valid slot → count of already-filled slots → duplicate slot. For an already-full day, **the four-readings error wins over the duplicate error**. API validation failures return HTTP `400` with `{ "error": "..." }`; duplicate account emails return `409`. PostgreSQL unique violations are caught as a fallback for simultaneous requests.
- Date values are returned as `YYYY-MM-DD` strings via the PostgreSQL type parser (`DATE`, OID 1082) to avoid time-zone conversion. Both API and frontend interpret **today** in `Asia/Kolkata`; configure this consistently if adapting the application to another timezone.
- Tests use `node:test` rather than Jest: this keeps dev dependencies minimal while Supertest still exercises real HTTP requests when a disposable PostgreSQL test database is available. The client uses the browser's native `fetch` rather than adding Axios; neither choice affects assignment requirements.
- Daily report shows all readings ordered by slot. The history panel is paginated by newest date.
- Dates are stored as PostgreSQL `DATE` values, not timestamps, because readings have a prescribed daily time slot and no exact clock time is required.
- For ease of review, a simple cookie-backed login is used rather than third-party identity providers. The app deliberately avoids medical interpretation and external analytics.
- **What I'd improve with more time:** React Testing Library form tests, charts, password reset/verified email, CSRF token for wider deployment scenarios, account deletion/export, production secret management, automated accessibility audits, monitoring, and a robust CI pipeline. Bonus Redis/BullMQ/doctor accounts were intentionally not added because core correctness came first.


## Logbook design notes

- The primary interaction mirrors a paper glucose diary: one day and four prescribed time slots. The monthly table presents a full calendar month, including blank entries.
- The combined `GET /api/reports?date=YYYY-MM-DD` returns daily, month-to-date and previous calendar month summaries in one request; it is a deliberate alternative to three routes.
- The browser uses `Asia/Kolkata` for `today` to match the default server `APP_TIMEZONE`. If the server timezone changes, update the client date helper too.
- Validation returns missing-value and range errors first, then future dates. When all four slots are full, the daily-limit message precedes the duplicate-slot message. Four unique slots already imply a four-reading maximum at the database level.
- Colored value bands are illustrative UI categories, **not** personalized targets, diagnosis, or medical advice. Clinical interpretation depends on the individual and the measurement timing.
- One month of readings is fetched in a dedicated authenticated query (at most 124 readings), avoiding truncation by history pagination.
- Production improvements would include TLS termination, CSRF defenses for cookie-authenticated mutation routes when deployed cross-origin, login monitoring, expanded React interaction tests, configurable timezone across client and server, and medically reviewed user-specific ranges rather than illustrative bands.


## Interface and usability

- Uses the supplied Sweety sugar-cube logo, favicon, lavender color tokens and Fraunces + Figtree type pairing.
- Four reading slots appear directly below the masthead. Empty slots open an autofocused numerical input; press Enter to save or Escape to cancel.
- Delete is accessible only when editing, with explicit confirmation.
- The monthly log shows dates only through today in the current month, collapses long empty periods, and lets any cell open the corresponding reading form.
- The print stylesheet expands collapsed periods so a paper copy includes each calendar day shown for the selected month.
- The 70–180 band is an illustrative category, not medical guidance. Aggregate values mix different meal slots and are not a diagnostic assessment.
- The month-to-date comparison uses the same numbered days of the previous month, clipped to its final day, rather than comparing with the full previous month.

## Grouped history

The Reading history section uses `GET /api/readings/days?limit=7&before=YYYY-MM-DD` to load seven complete calendar days containing readings. The `before` date is exclusive; the optional `nextBefore` cursor fetches older days, without splitting one day's readings across pages. Each day's four chips can open the related entry box; empty slots remain visible. The original reading-level paginated endpoint remains available for API clients.
