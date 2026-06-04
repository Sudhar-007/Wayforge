# Pathfinder Pipeline Testing Guide

How to manually exercise the AI roadmap pipeline end to end.

## Quick Start

### 1. Check your environment

```bash
python check_env.py
```

This verifies:
- ✅ `GEMINI_API_KEY` is set
- ✅ `SERPER_API_KEY` is set
- ✅ Backend is running on port 8000

### 2. Set your API keys

Copy `backend/.env.example` to `backend/.env` and fill in your keys:

```
GEMINI_API_KEY=your-gemini-key-here
SERPER_API_KEY=your-serper-key-here
```

> Without both keys the backend runs in **mock mode** and returns a sample
> roadmap instead of calling the live pipeline. The request below still works in
> mock mode — it just won't hit Gemini/Serper.

### 3. Start the backend

```bash
cd backend
python main.py
```

### 4. Hit the `/generate` endpoint

The frontend intake form posts directly to `POST /generate`. To exercise it by
hand, send the same payload with curl:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "web development",
    "level": "Beginner",
    "weekly": "4-7 hours",
    "goal": "get a software engineering job",
    "focus": "building projects"
  }'
```

The response is a roadmap document matching the frontend contract
(`src/types/roadmap.ts`): top-level `nodes[]` / `edges[]`.

## What to Watch

### In the response
A JSON roadmap with `nodes` and `edges`. In mock mode the nodes use placeholder
resources; in live mode they use real URLs returned by Serper.

### In the backend terminal (where main.py runs)
Look for the pipeline progress output:

```
Structured roadmap generation (/generate) started...
Track: web development, Level: beginner
Searching for resources...
Scraping content...
Validating URLs...
Ranking results...
Final context: 8 resources, 4 projects
Synthesizing roadmap (nodes/edges schema)...
```

## Troubleshooting

### "Returning mock roadmap" in the backend terminal
- Cause: `GEMINI_API_KEY` or `SERPER_API_KEY` is missing, so the backend fell
  back to `mock_structured_roadmap()`.
- Check: confirm both keys are set in `backend/.env`.

### "Final context: 0 resources, 0 projects"
- Cause: `SERPER_API_KEY` not set/invalid, or all URLs failed validation
  (404/timeout) — network issues, bad Serper results, or too strict a timeout.
- Check: confirm the key is in `backend/.env` and the host has network access.

### Roadmap has hallucinated URLs
- Cause: the model invented URLs instead of using the provided ones.
- Check: tighten the synthesizer prompt or send more resources if needed.

## Success Criteria

- ✅ Backend output shows all pipeline stages
- ✅ Serper returns resources (live mode: `Final context` > 0)
- ✅ At least 4–8 resources survive validation
- ✅ The roadmap conforms to `src/types/roadmap.ts` (nodes/edges)
- ✅ No `None` or hallucinated URLs in the roadmap
