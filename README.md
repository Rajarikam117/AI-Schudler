# AI Scheduler

A local-first personal scheduling assistant built with HTML, CSS, vanilla JavaScript, Node.js and Express. Tasks, preferences and saved schedules are stored in a JSON file on your computer. Optional AI scheduling and chat use Google's Gemini REST API through the local backend.

**No Vercel, serverless functions, cloud database, or frontend framework is required.** The application runs at `http://localhost:3000`.

## Features

- Responsive dashboard with task counts, progress and priority queue.
- Full task CRUD, priorities, estimates, categories, deadlines, planned times, notes and completion status.
- Durable local JSON storage and serialized writes.
- Gemini-powered schedule generation, with backend validation for intervals, overlaps, availability and task IDs.
- Rule-based local planner available without an API key.
- Daily timeline, saved schedule previews and explicit save action.
- Scheduling chat that reads task context but does not silently change saved tasks.
- Local working-hour and theme preferences, JSON data export, API rate limiting and consistent JSON errors.
- Automated tests with Node's built-in test runner.

## Requirements

- Node.js 20 or newer (includes native `fetch`).
- npm.
- Optional: a Google Gemini API key for AI features. Basic task management and the local planner work without it.

## Install on Windows

Open this folder in VS Code. In the integrated terminal, run:

```powershell
npm install
Copy-Item .env.example .env.local
npm start
```

Open `http://localhost:3000`. To restart automatically when source files change, use `npm run dev`.

### Configure Gemini

1. Obtain an API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. Edit `.env.local`:

```dotenv
GOOGLE_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

`GEMINI_API_KEY` is also accepted when `GOOGLE_API_KEY` is unset. Never commit `.env.local`, share your API key, or paste it into frontend files. Restart the server after changing the file. Availability of a model and API quota depend on your Google account and current API access.

## Commands

```powershell
npm install
npm start
npm run dev
npm test
```

## Data and backups

Live data is written to `data/database.json`, created automatically. It contains tasks, schedules, and non-sensitive preferences; it does not contain the Gemini API key. Runtime JSON data is ignored by Git. Use Settings → **Export data backup** to download a JSON copy. Keep backups private because they may contain personal task information.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health status |
| GET, POST | `/api/tasks` | List or create tasks |
| GET, PUT, DELETE | `/api/tasks/:id` | Read, update or delete a task |
| PATCH | `/api/tasks/:id/status` | Change completion status |
| GET, POST | `/api/schedules` | List or save a validated schedule |
| GET | `/api/schedules/:id` | Read a saved schedule |
| POST | `/api/schedules/generate` | Generate and validate a Gemini schedule |
| POST | `/api/schedules/preview-local` | Preview a local rule-based plan without AI |
| GET | `/api/ai/status` | Report Gemini configuration (never returns the key) |
| POST | `/api/ai/chat` | Send bounded scheduling chat messages to Gemini |
| GET, PUT | `/api/preferences` | Read or update local preferences |

Task priorities are `Low`, `Medium`, `High`, `Critical`; task status is `pending` or `completed`. AI generation returns a preview only; users must explicitly save the schedule. The backend re-validates all generated schedules. The local planner is a basic priority/deadline ordering heuristic, not AI.

## Tests

```powershell
npm test
```

The tests use the built-in Node test runner and do not need a Gemini API key.

## Troubleshooting

- **Port already used:** set a different `PORT` in `.env.local`, then use the matching localhost URL.
- **AI isn't configured:** add a key in `.env.local` and restart the server. Tasks and the local planner still work without it.
- **401/403 from Gemini:** check the key, API access and model name.
- **429 from Gemini:** the provider may be rate limited or over quota. Wait, check quota, and retry.
- **Cannot connect to Gemini:** confirm your PC has internet access.
- **Database error:** stop the server and inspect `data/database.json`. Export backups periodically.

## Security and limitations

This is a single-user local app, not a production multi-user service. The backend does not expose the Gemini key, limits AI requests, caps request sizes and validates inputs; however, anyone with local access to the app can see its task data. Do not expose this server publicly without authentication, HTTPS and additional security controls. Google Fonts requires internet for its hosted font; system fallbacks remain available. Gemini is an external service, so selected task details and prompts sent for AI scheduling/chat leave your computer. API quotas and model availability are controlled by Google. Generated schedules are previews until explicitly saved.
