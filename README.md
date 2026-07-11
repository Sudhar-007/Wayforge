# Wayforge

**Live app: [wayforge.page](https://wayforge.page)**

Wayforge is an AI-generated CS learning roadmap tool. You describe what you
want to learn, an AI pipeline generates a structured roadmap, and the app
renders it as an editable directed acyclic graph (DAG) styled similarly to
roadmap.sh. Sign in with GitHub to save roadmaps to your account, track
progress, and edit topics inline.

<img width="1705" height="992" alt="image" src="https://github.com/user-attachments/assets/2023ada1-e2c9-43d0-8c67-557139eb4a0e" />

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
- **Two ways to start** — generate with AI from a short intake form, or
  **create manually** on a blank canvas and build the roadmap node by node.
- **Polished UI** — the Wayforge design-token system with **light & dark**
  themes, built on Tailwind (no ad-hoc styles).

## Stack

**Frontend** — React + TypeScript + Vite, [React Flow](https://reactflow.dev/)
for the DAG, Zustand for state, Tailwind CSS (design tokens).

**Backend** — FastAPI (Python), Google Gemini for generation, Serper for
resource search, PostgreSQL (async SQLAlchemy + Alembic) for persistence.

## Project layout

```
.
├── frontend/             # Vite + React app
│   ├── index.html
│   ├── src/
│   │   ├── components/   # UI + custom React Flow nodes (components/nodes/)
│   │   ├── store/        # Zustand state (roadmapStore.ts)
│   │   ├── lib/          # Graph layout logic + helpers
│   │   ├── styles/       # Design tokens
│   │   └── types/        # roadmap.ts — the shared data contract
│   ├── mock-roadmap.json # Canonical example payload (data contract)
│   ├── package.json
│   ├── vite.config.ts    # + tailwind.config.js, postcss.config.js, tsconfig.json
│   └── .env.example      # frontend env (VITE_API_BASE_URL)
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
├── Dockerfile            # Backend image (built from the repo root)
├── docker-compose.yml    # PostgreSQL 16
└── deploy-swa.sh         # + migrate-azure.sh — deploy helpers
```

## Data contract

The roadmap schema is the source of truth for both ends of the app:
`frontend/mock-roadmap.json` is the canonical example and
`frontend/src/types/roadmap.ts` holds the matching TypeScript types. Backend
output and frontend rendering must both
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
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The frontend reads `VITE_API_BASE_URL` (default `http://localhost:8000`) — see
`frontend/.env.example`.

## Deployment

The backend is containerized (`Dockerfile`, built from the repo root) and runs on
**Azure Container Apps**; the frontend is a static Vite build served by **Azure
Static Web Apps**; persistence is **Azure Database for PostgreSQL**. Postgres TLS
is enabled per-driver via the `DB_SSL` env var. Prod required env vars are listed
in `backend/.env.example` plus the frontend's build-time `VITE_API_BASE_URL`.

The frontend is built with `cd frontend && npm run build` (outputs `frontend/dist`)
and shipped with `deploy-swa.sh`; the backend image is built from the repo root
(`docker build -f Dockerfile .`).

DNS is hosted on **Cloudflare** (registration stays at the registrar), with the
apex resolved via Cloudflare's CNAME flattening to the Static Web App hostname —
see the incident below for why.

## Incidents & fixes

Real problems hit in production and how they were resolved.

### DNS/SSL outage: stale apex IP after Azure rotated addresses (July 2026)

**Symptom.** `https://wayforge.page` started failing for all visitors with
`NET::ERR_CERT_COMMON_NAME_INVALID`, after roughly two weeks of working fine.
Because `.page` is an HSTS-preloaded TLD, browsers force HTTPS — so there was
no way to even reach the site past the certificate error.

**Diagnosis.** `nslookup` showed the apex resolving to an IP outside Azure's
ranges. The registrar's DNS zone looked correct — an ANAME (apex alias) record
pointing at the Static Web App hostname — but the registrar's ANAME
*flattening* was answering queries with a stale IP. Root cause chain: apex
domains can't hold a CNAME per the DNS spec, Azure Static Web Apps only
guarantees a hostname (not a static IP), the registrar's ANAME feature bridges
that gap by resolving the hostname server-side — and when Azure rotated the
IPs behind the hostname, the registrar's flattening kept serving the old
answer. Traffic landed on a server that wasn't ours, which presented a
certificate for a different domain.

**Fix.** Migrated DNS hosting (nameservers only — registration unchanged) to
Cloudflare, whose native apex CNAME flattening re-resolves the target
continuously. Re-validated the custom domain in Azure via a TXT ownership
record, after which Azure re-issued the managed TLS certificate. The apex now
tracks Azure's hostname live, so future IP rotations are handled
automatically.

**Lessons.**
- An apex record that stores a fixed IP (or flattens to a stale one) is a
  time bomb when the host only promises a hostname.
- This failed *silently* — nothing in the app changed, no alert fired. An
  external uptime check would have caught it in minutes instead of by chance.
- Control plane vs data plane: the app itself was healthy the whole time;
  only the path to it broke.

## Known limitations & tradeoffs

Deliberate tradeoffs and known rough edges, with root causes where diagnosed.

- **Cold starts (~15–40 s).** The backend runs on Azure Container Apps with
  **scale-to-zero** to keep hosting costs near zero for a portfolio project.
  The first request after an idle period has to pull and boot the container,
  so initial generation or login after inactivity is noticeably slow.
  Tradeoff accepted: cost over latency.
- **Stale open tabs can hang.** If the app is left open long enough for the
  backend to scale to zero, the next API call from that tab can appear to
  load indefinitely. Root cause: frontend fetches have no timeout /
  `AbortController`, so a request that arrives mid-cold-start waits silently.
  Planned fix: a warm-up ping on tab visibility change plus fetch timeouts
  with a "waking the server up" state in the UI.
- **Generation is intentionally rate-limited** (3/hour, 15/day per user plus
  a global daily ceiling) to cap LLM API spend. Heavy exploration will hit
  the limit by design.
- **LLM output quality varies.** Generation uses a fast, low-cost Gemini
  model; the validate step catches structural problems, but resource
  relevance and topic granularity can still vary between runs.
- **No offline/unsaved-work protection.** Edits live in client state until
  saved; closing the tab before saving loses them.

## Security

- **Secrets are environment-only.** No keys, tokens, or passwords are committed;
  `.env` is gitignored and the repo ships only `.env.example` placeholders. The
  history is scanned with gitleaks + trufflehog.
- **Auth.** GitHub OAuth with HS256 JWT sessions; the backend refuses to start
  unless `JWT_SECRET` is set and ≥32 chars, and pins the JWT algorithm on decode.
- **Authorization.** Every roadmap route is authenticated and ownership-checked
  (404 on missing, 403 on not-owner) — users can only touch their own data.
- **Abuse limits.** Per-user + global rate limits on `/generate`; request-body
  size cap, roadmap payload/count caps, and validated/length-bounded inputs.
- **CORS** is restricted to the configured frontend origin (+ localhost for dev).
- **Dependencies** are pinned for reproducible builds.

Found something? Please open a private security advisory rather than a public issue.

## Status

Built: AI generation pipeline, DAG rendering + inline editing, GitHub OAuth + JWT
auth, roadmap persistence, the My Roadmaps list (continue / rename / delete),
roadmap title rename, override-vs-save-new logic, the manual-create flow + guided
empty editor, and the Wayforge redesign (green tokens, light/dark themes).

Not built yet: publishing roadmaps, drag-to-connect edges, and undo/redo.

## License

Released under the [MIT License](LICENSE).
