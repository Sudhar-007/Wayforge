# PathFinder Pipeline Testing Guide

## Quick Start

### 1. Check Environment
```bash
python check_env.py
```

This will verify:
- ✅ SERPER_API_KEY is set
- ✅ Ollama is running with llama3.1:8b model
- ✅ Backend is running on port 8000

### 2. Set SERPER_API_KEY

**Windows (Command Prompt):**
```cmd
set SERPER_API_KEY=your-key-here
```

**Windows (PowerShell):**
```powershell
$env:SERPER_API_KEY="your-key-here"
```

**Linux/Mac:**
```bash
export SERPER_API_KEY='your-key-here'
```

### 3. Start Ollama (if not running)
```bash
ollama serve
```

In another terminal:
```bash
ollama pull llama3.1:8b
```

### 4. Start Backend (if not running)
```bash
cd PathFinder/backend
python main.py
```

### 5. Run the Full Pipeline Test
```bash
python test_full_pipeline.py
```

## What to Watch

### In the Test Terminal
You'll see the 5-question interview flow and the final roadmap.

### In the Backend Terminal (where main.py runs)
Look for these DEBUG outputs:

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
Validation: 30 live, 15 dead links removed
After validation - resources: 18, projects: 12

Ranking results...

=== URLS BEING SENT TO OLLAMA ===
  - https://www.freecodecamp.org/...
  - https://developer.mozilla.org/...
  - https://www.theodinproject.com/...
=================================

Resource context being sent:
AVAILABLE RESOURCES:
1. freeCodeCamp - Learn to Code
   URL: https://www.freecodecamp.org/learn
   About: Learn to code with free online courses...
```

## Troubleshooting

### No DEBUG output in backend terminal
- Problem: `generate_roadmap()` is not being called
- Solution: The LLM is generating roadmap during interview instead of triggering INTERVIEW_COMPLETE
- Check: Look for "INTERVIEW_COMPLETE" in the assistant's 5th response

### "Raw resources from Serper: 0"
- Problem: SERPER_API_KEY not set or invalid
- Solution: Check environment variable with `echo %SERPER_API_KEY%` (Windows) or `echo $SERPER_API_KEY` (Linux/Mac)

### "After validation - resources: 0"
- Problem: All URLs failed validation (404/timeout)
- Possible causes:
  - Network issues
  - Serper returned bad URLs
  - Too strict validation timeout

### Roadmap has hallucinated URLs
- Problem: LLM is inventing URLs instead of using provided ones
- Check: Make sure "URLS BEING SENT TO OLLAMA" shows real URLs
- Solution: Improve the system prompt or increase number of resources

## Expected Flow

1. ✅ Interview starts (5 questions)
2. ✅ After question 5, LLM outputs "INTERVIEW_COMPLETE"
3. ✅ Backend parses interview data
4. ✅ `generate_roadmap()` is called
5. ✅ DEBUG output appears in backend terminal
6. ✅ Serper searches for resources
7. ✅ URLs are scraped and validated
8. ✅ Top resources are selected
9. ✅ Resources are sent to Ollama
10. ✅ Ollama generates roadmap using ONLY provided URLs
11. ✅ Roadmap is returned to user

## Success Criteria

✅ Backend DEBUG output shows all pipeline stages
✅ Serper returns > 0 resources
✅ At least 4-8 resources survive validation
✅ URLs in final roadmap match those from "URLS BEING SENT TO OLLAMA"
✅ No "None" or hallucinated URLs in roadmap
