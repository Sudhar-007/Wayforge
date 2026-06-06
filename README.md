# Wayforge

**Live app: [wayforge.page](https://wayforge.page)**

Wayforge is an AI-generated CS learning roadmap tool. You describe what you
want to learn, an AI pipeline generates a structured roadmap, and the app
renders it as an editable directed acyclic graph (DAG) styled similarly to
roadmap.sh. Sign in with GitHub to save roadmaps to your account, track
progress, and edit topics inline.

## Features

- **AI roadmap generation** — a multi-stage pipeline (intent → search → scrape →
  rank → validate → synthesize) turns a short intake form into a structured,
  resource-backed roadmap. Falls back to a sample roadmap when API keys are absent.
- **Interactive DAG** — roadmaps render as an editable graph (React Flow): cycle
  node status, edit titles/descriptions, add resources, and branch new nodes.
- **GitHub sign-in** — OAuth login with JWT sessions persisted in the browser.
- **Saved roadmaps** — save to your account, list them on the **My Roadmaps**
  page (with per-roadmap progress), reopen, rename, and delete.
- **Smart save** — the viewer tracks unsaved edits; saving an already-saved
  roadmap lets you **update in place** or **save as a new copy**.
- **Rate-limited generation** — `/generate` requires sign-in and enforces
  per-user limits (3/hour, 15/day) plus a global daily ceiling, with counters
  persisted in Postgres so they survive cold starts. The intake form shows a
  heads-up when you're near the limit.

## Stack

**Frontend** — React + TypeScript + Vite, [React Flow](https://reactflow.dev/)
for the DAG, Zustand for state, Tailwind CSS (design tokens).

**Backend** — FastAPI (Python), Google Gemini for generation, Serper for
resource search, PostgreSQL (async SQLAlchemy + Alembic) for persistence.

## Project layout

```
.
├── src/                  # Frontend app (the real one)
│   ├── components/       # UI + custom React Flow nodes (components/nodes/)
│   ├── store/            # Zustand state (roadmapStore.ts)
│   ├── lib/              # Graph layout logic + API helpers
│   ├── data/             # Mock roadmap data
│   └── types/            # roadmap.ts — the shared data contract
├── backend/              # FastAPI app + AI pipeline
│   ├── main.py           # API entrypoint (/generate, /auth, /roadmaps, /limits, /health)
│   ├── auth.py           # JWT sessions + current-user dependency
│   ├── oauth.py          # GitHub OAuth flow
│   ├── intent_mapper.py  # ── AI pipeline ──
│   ├── searcher.py       #
│   ├── scraper.py        #
│   ├── ranker.py         #
│   ├── validator.py      #
│   ├── synthesizer.py    # ─────────────────
│   ├── database.py       # Async SQLAlchemy engine + session
│   ├── models.py         # ORM models (User, Roadmap, RateLimitCounter)
│   ├── schemas.py        # Pydantic schemas
│   └── alembic/          # DB migrations
├── docker-compose.yml    # PostgreSQL 16
├── mock-roadmap.json     # Canonical example payload (data contract)
└── the project notes             # Project guide / scope discipline
```

## Data contract

The roadmap schema is the source of truth for both ends of the app:
`mock-roadmap.json` is the canonical example and `src/types/roadmap.ts` holds
the matching TypeScript types. Backend output and frontend rendering must both
conform. If the schema changes, update both together. Saved roadmaps store this
full document in the `roadmaps.data` JSONB column.

## Getting started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker Desktop (for PostgreSQL)

### 1. Database

```bash
docker compose up -d                 # start PostgreSQL 16 on localhost:5432
cd backend && alembic upgrade head   # create tables
```

Defaults: db/user `pathfinder`, password `devpass`. Data persists in the
`pathfinder_pgdata` volume.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then fill in the values below
python main.py         # http://localhost:8000
```

`.env` keys (see `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini key for generation ([get one](https://aistudio.google.com/apikey)) |
| `SERPER_API_KEY` | Serper key for resource search ([get one](https://serper.dev/dashboard)) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App ([create one](https://github.com/settings/developers)) |
| `JWT_SECRET` | Long random string used to sign session JWTs |
| `FRONTEND_URL` | Where the frontend runs (OAuth redirects here); default `http://localhost:5173` |
| `BACKEND_URL` | Public base URL of this backend; default `http://localhost:8000` |

Set the GitHub OAuth App's **Authorization callback URL** to
`{BACKEND_URL}/auth/github/callback` (e.g. `http://localhost:8000/auth/github/callback`).

Without `GEMINI_API_KEY` / `SERPER_API_KEY` the backend runs in **mock mode**
and returns a sample roadmap, so you can develop the frontend without external
services. (GitHub sign-in still requires the OAuth + JWT values.)

### 3. Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

The frontend reads `VITE_API_BASE_URL` (default `http://localhost:8000`) — see
the root `.env.example`.

## Testing the pipeline

With the backend running:

```bash
cd backend
python check_env.py       # verify keys + backend are up
# then POST to /generate (see backend/TESTING_GUIDE.md for a curl example)
```

See `backend/TESTING_GUIDE.md` for details.

## Status

Built: AI generation pipeline, DAG rendering and inline editing, GitHub OAuth +
JWT auth, roadmap persistence, the My Roadmaps list (continue / rename / delete),
roadmap title rename, and override-vs-save-new logic.

Not built yet: publishing roadmaps, drag-to-connect edges, and undo/redo. See
`the project notes` for the current scope map.
