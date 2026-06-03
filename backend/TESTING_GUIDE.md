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
> roadmap instead of calling the live pipeline. The test below still works in
> mock mode — it just won't hit Gemini/Serper.

### 3. Start the backend

```bash
cd backend
python main.py
```

### 4. Run the pipeline test

```bash
python test_pipeline.py
```

This drives a full 5-question interview against `/chat` and prints the final
roadmap.

## What to Watch

### In the test terminal
You'll see the 5-question interview flow followed by the generated roadmap JSON.

### In the backend terminal (where main.py runs)
Look for the pipeline DEBUG output:

```
============================================================
ROADMAP GENERATION STARTED
============================================================
Building search strategy for: {...}
Track: web development, Level: beginner
Queries: ['best web development tutorial for beginner', ...]

Searching for resources...
Raw resources from Serper: 25
Raw projects from Serper: 20

Scraping content...
Validating URLs...
After validation - resources: 18, projects: 12

Ranking results...

=== URLS BEING SENT TO GEMINI ===
  - https://www.freecodecamp.org/...
  - https://developer.mozilla.org/...
  - https://www.theodinproject.com/...
=================================
```

## Troubleshooting

### No DEBUG output in the backend terminal
- Cause: `generate_roadmap()` was not called — the model generated a roadmap
  during the interview instead of emitting `INTERVIEW_COMPLETE`.
- Check: the 5th assistant reply should trigger generation (the backend also
  force-generates after 5 user messages).

### "Raw resources from Serper: 0"
- Cause: `SERPER_API_KEY` not set or invalid.
- Check: confirm the key is in `backend/.env`.

### "After validation - resources: 0"
- Cause: all URLs failed validation (404/timeout) — network issues, bad Serper
  results, or too strict a validation timeout.

### Roadmap has hallucinated URLs
- Cause: the model invented URLs instead of using the provided ones.
- Check: "URLS BEING SENT TO GEMINI" shows real URLs; tighten the system prompt
  or send more resources if needed.

## Success Criteria

- ✅ Backend DEBUG output shows all pipeline stages
- ✅ Serper returns > 0 resources
- ✅ At least 4–8 resources survive validation
- ✅ URLs in the final roadmap match those from "URLS BEING SENT TO GEMINI"
- ✅ No `None` or hallucinated URLs in the roadmap
