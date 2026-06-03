# Pathfinder

Pathfinder is an AI-generated CS learning roadmap tool. You describe what you
want to learn, an AI pipeline generates a structured roadmap, and the app
renders it as an editable directed acyclic graph (DAG) styled similarly to
roadmap.sh. You can track progress and edit topics inline.

## Stack

**Frontend** — React + TypeScript + Vite, [React Flow](https://reactflow.dev/)
for the DAG, Zustand for state, Tailwind CSS (design tokens).

**Backend** — FastAPI (Python), Google Gemini for generation, Serper for
resource search, PostgreSQL for persistence.

## Project layout

```
.
├── src/                  # Frontend app (the real one)
│   ├── components/       # UI + custom React Flow nodes (components/nodes/)
│   ├── store/            # Zustand state
│   ├── lib/              # Graph layout logic
│   ├── data/             # Mock roadmap data
│   └── types/            # roadmap.ts — the shared data contract
├── backend/              # FastAPI app + AI pipeline
│   ├── main.py           # API entrypoint (/generate, /chat, /users, /health)
│   ├── intent_mapper.py  # ── AI pipeline ──
│   ├── searcher.py       #
│   ├── scraper.py        #
│   ├── ranker.py         #
│   ├── validator.py      #
│   ├── synthesizer.py    # ─────────────────
│   ├── database.py       # Async SQLAlchemy engine + session
│   ├── models.py         # ORM models
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
conform. If the schema changes, update both together.

## Getting started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker Desktop (for PostgreSQL)

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then fill in GEMINI_API_KEY and SERPER_API_KEY
python main.py         # http://localhost:8000
```

Without API keys the backend runs in **mock mode** and returns a sample roadmap,
so you can develop the frontend without external services.

### Database

```bash
docker compose up -d              # start PostgreSQL 16 on localhost:5432
cd backend && alembic upgrade head  # create tables
```

Defaults: db/user `pathfinder`, password `devpass`. Data persists in the
`pathfinder_pgdata` volume.

## Testing the pipeline

With the backend running:

```bash
cd backend
python check_env.py       # verify keys + backend are up
python test_pipeline.py   # drive a full interview and print the roadmap
```

See `backend/TESTING_GUIDE.md` for details.

## Project phases

Pathfinder is a 4-phase project, currently in **Phase 1**: AI generation
pipeline, roadmap rendering as a DAG, and inline node editing. Authentication,
publishing, and graph-editing features belong to later phases — see `the project notes`.
