# Before submitting to Kenpath

Due: **Friday, 13 November 2026** (as stated in the assignment email).

## Required behavior

- [ ] Sign up; stored password is a bcrypt hash (not plaintext)
- [ ] Log in and log out; second account cannot read, edit, or delete first account's data
- [ ] Add, list, edit, and delete readings
- [ ] Four slots: fasting, after breakfast, after lunch, after dinner
- [ ] Value required, integer range 40–600, no duplicate slot/day, maximum four/day, no future dates
- [ ] Clear visible validation errors
- [ ] Daily min/max/average/count and per-slot list
- [ ] Month-to-date from 1st to selected date
- [ ] Previous full month, including cross-year and leap-year dates
- [ ] Friendly empty states

## Submission materials

- [ ] `npm install` and `npm run dev` start on your own computer
- [ ] `npm run db:migrate` + `npm run db:seed` work with PostgreSQL
- [ ] `npm test` passes (19 isolated tests), plus run the optional HTTP/PostgreSQL suite using a `*_test` database if available
- [ ] `npm run build` succeeds
- [ ] `.env` is not committed; `.env.example` contains all needed keys
- [ ] README installation + DB setup + tests + Notes are complete
- [ ] Public GitHub repo with **multiple meaningful commits**, not one giant first commit
- [ ] Screenshots OR a 2–3 minute screen recording of real working functionality
- [ ] Reply to Kenpath assignment email in the same thread with GitHub link and screenshots/video

## Test coverage to demonstrate

- [ ] A fully occupied date returns the **four-readings maximum** error, even when the selected slot already exists.
- [ ] Editing a reading without changing its slot succeeds; changing it to another occupied slot fails.
- [ ] Sign in as user B and verify no access to user A's readings or reports.
- [ ] January's previous-month report correctly covers December of the preceding year.
- [ ] Test report averages with two readings and an empty-month response.

## Suggested commit history (create commits as you verify each stage)

1. `chore: initialize React, Express and PostgreSQL workspaces`
2. `feat(db): add users and glucose readings schema with constraints`
3. `feat(api): add authentication and user-scoped readings CRUD`
4. `feat(api): add daily and monthly report endpoints`
5. `feat(ui): build accessible login and responsive tracker dashboard`
6. `test: cover date validation and backend flows`
7. `docs: add setup, seed, demo notes and submission checklist`

Do not manufacture a false history with artificial timestamps. If you start with a ZIP containing all files, it is acceptable to commit working improvements in stages after review; be transparent about the work you actually did.
