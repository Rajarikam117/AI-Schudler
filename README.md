# AI Scheduler

Local-first personal scheduling app built with HTML, CSS, vanilla JS, Node.js and Express, with optional Gemini AI. Task and schedule data stays in `data/database.json`. No Vercel, serverless functions, cloud database, or framework dependency.

## Run on Windows

Requires Node.js 20+.

```powershell
npm install
Copy-Item .env.example .env.local
npm start
```

Open http://localhost:3000. Add a Google Gemini key in `.env.local` for AI features:

```dotenv
GOOGLE_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

Get a key from https://aistudio.google.com/app/apikey. Keep `.env.local` private; the backend does not return the key. Basic task CRUD and the rule-based planner work without AI.

## Commands

`npm run dev` to restart on changes; `npm test` runs the Node test suite.

## Features

- Responsive overview dashboard, search and filters.
- CRUD tasks, priority, estimated time, dates, deadlines, notes, status.
- Local JSON persistence with serialized writes and exportable backup.
- Gemini schedule generation and scheduling chat, server-side validation and bounded AI requests.
- Local fallback planner, daily timeline, saved plans, theme and working-hour settings.

## API

`GET /api/health`; `GET/POST /api/tasks`; `GET/PUT/DELETE /api/tasks/:id`; `PATCH /api/tasks/:id/status`; `GET/POST /api/schedules`; `GET /api/schedules/:id`; `POST /api/schedules/generate`; `POST /api/schedules/preview-local`; `GET /api/ai/status`; `POST /api/ai/chat`; `GET/PUT /api/preferences`.

## Data & security

Runtime data is stored in `data/database.json`, ignored by Git. Export backups from Settings and store them safely. AI requests send selected task details to Google's Gemini service. This is a local single-user app; do not expose it publicly without authentication and further security controls. Google Fonts uses internet; system font fallbacks are available.
