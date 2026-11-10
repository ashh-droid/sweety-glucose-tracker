# Sweety — demo capture guide (2–3 minutes, narration optional)

A screen recording can be silent: simply show the steps and keep the cursor movements slow enough to follow. Screenshots are explicitly accepted as an alternative by Kenpath.

## Suggested recording flow

1. **0:00–0:15 — Welcome and sign-in:** Show the sign-in page, then log in as the demo account.
2. **0:15–0:35 — Overview:** Show the three reports and the four readings for today. Select another day, then return to today.
3. **0:35–1:10 — CRUD:** Click **Add a reading** on a date with an available slot; enter a valid number. Edit its value, then delete it with confirmation.
4. **1:10–1:45 — Validation:** Show a blank number, a value below 40, a future date, and a duplicate time slot. Read the inline error alerts. Use the demo seeded day for the four-reading cap.
5. **1:45–2:10 — Reports:** Pick a date in October 2026 to demonstrate how daily, month-to-date, and previous-month ranges change, including an empty state if no entries exist.
6. **2:10–2:30 — Privacy:** Log out. Create a second account and show that its reading list is empty rather than showing the first patient's records.
7. **2:30–2:45 — Code quality:** Briefly show `README.md`, `.env.example` (not `.env`), `schema.sql`, and terminal test output.

**Important:** For the demo, use only fictitious data and do not display real patient names, passwords, cookies, or environment secrets. If screen-recording the account signup, use a fictional email and password only.

## Screenshot alternative

Capture **real running app screens**, named clearly:

- `01-sign-in.png`
- `02-dashboard-reports.png`
- `03-add-reading.png`
- `04-validation-error.png`
- `05-edit-reading.png`
- `06-empty-state.png`
- `07-tests-terminal.png`

Screenshots are not included in the starter archive because these must come from the app running with your PostgreSQL database, not fabricated mock screens. Put your real screenshots under `docs/screenshots/` if you want them hosted on GitHub.
