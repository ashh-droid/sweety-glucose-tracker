# Sweety | Blood Glucose Logbook

A private, responsive logbook for recording four daily glucose readings and reviewing daily and monthly summaries.

Built with **React + Vite, Node.js + Express, and PostgreSQL** for the Kenpath Junior Full Stack Developer assignment.

> **Demo only.** Sweety records readings; it is not a medical device or a source of treatment advice. All seeded readings are fictional.

## Quick start

**Requirements:** Node.js 20+, npm, and a running PostgreSQL 13+ server.

Create a PostgreSQL database named `sweety` (with SQL Shell/pgAdmin, or `psql -U postgres -c "CREATE DATABASE sweety;"`). Then, from the repository root:

```bash
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL and a unique JWT_SECRET.
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://localhost:5173**. Vite proxies API requests to the Express server on port 4000.

**Demo login (local development only):** `demo@sweety.local` / `Demo12345!`. The **Use demo** button fills these fields automatically when running `npm run dev`, without signing in for you. It is **hidden in production builds**. Set `VITE_SHOW_DEMO=false` in an untracked `client/.env.local` to hide it during development.

The `.env` file must stay out of Git. Do not run the seed script against real patient data or use these demo credentials for a public deployment.

## Features

- **Accounts:** register, log in and log out; bcrypt password hashing; HTTP-only, SameSite=Strict session cookies.
- **Four daily slots:** morning fasting, after breakfast, after lunch and after dinner. Add, edit or delete entries within the corresponding box.
- **Validation:** whole-number readings from **40 to 600 mg/dl**, no future dates, one reading per slot and at most four per day. Friendly errors are returned by the API and shown in the UI.
- **Reports:** selected day, month to date and previous full calendar month, with count, lowest, highest and average to one decimal place. Month-to-date can be compared with matching days from the previous month.
- **Logbook views:** a monthly four-column grid, clickable date/slot cells, day-grouped history with an average per day and a button for older history, plus print-friendly monthly output.
- **Accessibility:** responsive phone/tablet/desktop layouts, keyboard-friendly entry, text labels alongside color reference bands, inline validation and loading/empty states.
- **Bonus:** database-backed cursor pagination by complete reading days and the conventional paginated readings endpoint.

The displayed **70–180 reference band** and its color categories are illustrative, not personal glucose goals. The app does not interpret readings medically. Averages combine different time slots.

## Tests

```bash
npm test
npm run build
```

`npm test` runs **28 standalone tests** (17 server-side validation/date tests, 2 browser-side date tests, 6 month-grid tests and 3 daily-history-average tests). The PostgreSQL integration suite is skipped unless a disposable test database is configured.

The integration suite exercises real HTTP requests and database operations: registration, password hashing, cookies, user isolation, validation, CRUD, reports, full-day history pagination and logout.

```bash
# Create a dedicated PostgreSQL database named sweety_test first.
TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test npm run test:integration
```

The test command refuses to run unless the URL names a database ending in `_test`. Use a disposable database only. See the Windows setup below for the PowerShell equivalent.

## API

All reading/report endpoints require authentication, and each query is scoped to the current user.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Read current session |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/readings?date=YYYY-MM-DD` | List own readings, optionally filtered by date |
| GET | `/api/readings?page=1&limit=20` | Paginate individual readings |
| GET | `/api/readings/days?limit=7&before=YYYY-MM-DD` | Paginate complete days with an exclusive date cursor |
| GET | `/api/readings/month?month=YYYY-MM` | Read a whole month for the diary |
| POST | `/api/readings` | Add `{ "date", "slot", "value" }` |
| PATCH / PUT | `/api/readings/:id` | Edit an owned reading |
| DELETE | `/api/readings/:id` | Delete an owned reading |
| GET | `/api/reports?date=YYYY-MM-DD` | Three report periods in one response |
| GET | `/api/health` | API health check |

Valid slot identifiers: `morning_fasting`, `after_breakfast`, `after_lunch`, `after_dinner`.

Example reading:

```json
{ "date": "2026-10-15", "slot": "after_lunch", "value": 128 }
```

## Design decisions and assumptions

- The assignment's “MERN + PostgreSQL” wording is interpreted as **React, Express, Node.js and PostgreSQL**, since the requirement explicitly calls for PostgreSQL.
- “Previous month” means the full previous calendar month, not the last 30 days. Month-to-date starts on the first of the selected month. Its comparison covers equivalent day numbers in the previous month, capped at that month's final day.
- The four prescribed slots are stored in a PostgreSQL `DATE`-based table. The database enforces `UNIQUE(user_id, reading_date, slot)` and a value `CHECK` constraint. Server checks also return readable messages for missing values, out-of-range values, future dates, a full day and duplicate slots.
- The server defaults to `APP_TIMEZONE=Asia/Kolkata`; the frontend uses the same timezone for “today”. PostgreSQL dates are kept as `YYYY-MM-DD` strings to avoid unintended timezone conversion.
- Reports use SQL aggregates. The history endpoint fetches complete days, not arbitrary batches of individual readings; monthly readings use a separate bounded query.
- The interface follows a paper diary: four consistently ordered entry slots, a compact month grid and grouped reading history. The custom sugar-cube logo uses a lavender scale. Plus Jakarta Sans is used for headings/branding and Figtree for body copy.
- Passwords are bcrypt-hashed (cost 12); the JWT is sent in an HTTP-only cookie. Parameterized queries and user-scoped reads/updates/deletes protect account ownership. Expired sessions return users to the sign-in screen.

**Future improvements:** form interaction tests with React Testing Library, verified-email/password reset, export and account deletion, a configurable timezone shared by client and server, CSRF protection for more complex deployments, and monitoring/CI. The priority here is reliable core behavior rather than adding Redis, background queues or a doctor role.

## Windows setup and other options

If using Windows PowerShell, use `npm.cmd` when script execution policy blocks `npm.ps1`:

```powershell
Copy-Item .env.example .env
# Edit .env with the real DATABASE_URL and a strong JWT_SECRET.
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

To create the database using Windows **SQL Shell (psql)**, connect to PostgreSQL, type `CREATE DATABASE sweety;` at the `postgres=#` prompt, and then `\q` to exit. **Do not type SQL commands directly into PowerShell.**

To run the integration suite from PowerShell:

```powershell
# First create sweety_test in SQL Shell (psql).
$env:TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test"
npm.cmd run test:integration
Remove-Item Env:TEST_DATABASE_URL
```

**Optional Docker database:** `docker compose up -d postgres`, then set `DATABASE_URL=postgresql://sweety:sweety_local_only@localhost:5432/sweety` in `.env`. Docker is not required and should not be started if another PostgreSQL server already occupies port 5432.

**Production-style local build:**

```bash
npm run build
npm start
```

Open **http://localhost:4000** after building. A real deployment additionally needs HTTPS, production secrets, security review and its own non-demo data; the local assignment app is not a medical product.
