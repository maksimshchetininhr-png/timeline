# Our timeline

A private family journal with a searchable timeline, a world map, and side-by-side city/country comparison for any date. Built with React, Vite, Express, and SQLite.

**The GitHub repository contains the application code, not the family's personal history.** Personal records, original spreadsheets, password hashes, and added memories stay in private server storage. Public tests use fictional data.

## Run

Use Node.js 24 or later.

```bash
npm ci
npm run dev
```

The development frontend listens on port 5173 and proxies `/api` to the API on port 3001. On the first visit, create a family password of at least 12 characters. Family members need it to read or add memories. Passwords are stored as salted scrypt hashes. Complete password setup before sharing a hosted installation.

For production:

```bash
npm run build
npm start
```

Production serves the frontend and protected API from one Node.js server on port 3001, or the configured `PORT`. A fresh clone starts with an empty journal: add memories through the interface or import your own spreadsheets privately.

## Add the private timeline data

The original family data has been imported and retained in the onboarding workspace at `.local/timeline.json`. This file is intentionally excluded from GitHub. Importing fresh spreadsheets requires Python with `openpyxl`:

```bash
python3 -m pip install openpyxl
python3 scripts/import_workbooks.py /path/to/life_timeline_master.xlsx /path/to/life_timeline_matrix_master.xlsx
```

The importer writes `DATA_DIR/timeline.json`, defaulting to `.local/timeline.json`. Restart the server after importing. It reads spreadsheet cells as data; it does not execute workbook notes or formulas. The source spreadsheets are never modified. Added memories in SQLite stay separate from the imported baseline.

When deploying to another server, transfer `.local/timeline.json` through your host's private file-transfer mechanism into its persistent `DATA_DIR`. Keep this file out of the public repository and publicly served directories. Running the app with an existing imported file does not need Python or the original attachments.

## Features

- Search and filter by person, category, chapter, and year; chronological timeline and event details.
- Date picker and time slider for simultaneous location comparison.
- World map, country browsing, and dated career/education context from the timeline matrix.
- Add home, trip, relationship, and other memories; remove added memories while preserving imported records.
- Family password setup, login, logout, protected API, HttpOnly cookies, rate limiting, and browser-write origin checks.
- Responsive desktop, tablet, and mobile layouts with keyboard-accessible dialogs.
- Fonts, maps, and the canal illustration are bundled locally. No third-party map or font service is required.

## Location accuracy

A dated trip takes priority over a recorded home. A home is labelled **recorded residence**, not proof of physical presence. Country-only trips and multi-city routes do not invent a city for every day. Specific city subrecords refine broader trips in the same country; contradictory records remain visible. A trip without an end date covers its recorded day only. Approximate and inferred dates stay labelled as uncertain.

Separate location histories must be recorded for each person. Marriage or living together does not automatically mean shared travel. Unknown locations remain unknown until added. City coordinates and country centers are illustrative markers; unfamiliar locations can be compared as text even if a map marker is unavailable. The canal artwork is an illustration, not a personal family photograph. Financial sheets are outside this journal's scope, and financial notes are excluded from imported descriptions.

## Hosting and storage

GitHub stores the source code. **GitHub Pages cannot run this app's Express server, authentication, or SQLite database.** For a live family link, deploy to a host that runs Node.js and supplies a persistent disk.

Build with `npm ci && npm run build`; start with `npm start`. Mount persistent storage and set `DATA_DIR` to it. Use HTTPS and `SECURE_COOKIES=true`. Set `TRUST_PROXY=true` only behind your host's trusted reverse proxy.

Preserve `DATA_DIR/timeline.json` and `DATA_DIR/memories.sqlite`, including their backups. Sessions live in memory, so restarting asks family members to log in again. This version uses a shared family password; everyone with it can read, add, and remove added memories. Individual accounts and separate editor roles are not implemented.

| Variable | Purpose |
| --- | --- |
| `PORT` | Listening port; defaults to 3001 |
| `HOST` | Listening interface; defaults to 0.0.0.0 |
| `DATA_DIR` | Persistent directory for private JSON and SQLite; defaults to `.local` |
| `TIMELINE_DATA_FILE` | Optional private baseline JSON path; defaults to `DATA_DIR/timeline.json` |
| `FAMILY_PASSWORD` | Optional password override, supplied securely through host settings; otherwise use first-visit setup |
| `SECURE_COOKIES` | Set `true` for HTTPS hosting |
| `TRUST_PROXY` | Set `true` only for a trusted reverse proxy |

An ignored `.env` file is loaded by `npm run dev` and `npm start` if present. Never commit credentials, databases, or personal history. No external credentials or database service are required to run locally.

## Verify

```bash
npm test
npm run build
npm run test:browser
```

The logic/API tests cover location precedence, overlaps, missing data, precision, filtering, private access, owner setup, storage across process restart, and logout. Browser tests cover the full family workflow on desktop and mobile. All public test records are fictional; the tests use temporary databases and never change the private family database.

Browser tests require Chromium at `/usr/bin/chromium`, or an executable supplied through `PLAYWRIGHT_CHROMIUM`. Tests use API ports 3091 and 3092. Screenshots are saved under ignored `.local/screenshots`.
