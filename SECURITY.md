# Security Guide

## API Keys & Environment Variables

This project loads secrets from a local **`.env`** file (read via `python-dotenv`).
Never commit API keys directly.

### Setup for Development

1. **Create your env file**

   Copy the example and fill in your real keys:

   ```bash
   # Windows (PowerShell)
   Copy-Item backend/.env.example backend/.env

   # Mac / Linux
   cp backend/.env.example backend/.env
   ```

2. **Add your secrets to `backend/.env`**

   ```dotenv
   GEMINI_API_KEY=your-gemini-api-key-here
   SERPER_API_KEY=your-serper-api-key-here
   # Optional: override the default model
   # GEMINI_MODEL=gemini-2.0-flash-lite
   ```

3. **Run the backend**

   ```bash
   cd backend
   python main.py
   ```

   `load_dotenv()` in `main.py` automatically picks up `backend/.env`.

### Required Environment Variables

- `GEMINI_API_KEY`: API key for Google Gemini (roadmap generation)
  - Get it from: https://aistudio.google.com/apikey
- `SERPER_API_KEY`: API key for Serper (Google Search API)
  - Get it from: https://serper.dev/dashboard

### What's Protected

✅ **Safe to commit:**
- All `.py` files (use `os.environ.get()`)
- `.env.example` template files (no real keys)
- `.gitignore`

❌ **NEVER commit:**
- `.env` files (already gitignored)
- Any file with `API_KEY` or `SECRET` in plain text
- Shell scripts with hardcoded keys

### Before Pushing to GitHub

Run this checklist:

```bash
# 1. Verify no .env files are tracked
git ls-files | grep .env

# 2. Check .gitignore is working
git status

# 3. Search for potential API keys hardcoded in code
grep -r "API_KEY.*=" . --include="*.py" | grep -v "os.environ"
```

### If You Accidentally Commit a Secret

1. **Immediately revoke the API key** at the provider (Gemini / Serper)
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (⚠️ dangerous):
   ```bash
   git push origin --force --all
   ```
4. Generate a new API key

### For Production Deployment

- Never use `set` or `export` with hardcoded keys in deployment scripts
- Use platform-native secret managers:
  - **Vercel**: Environment Variables in dashboard
  - **Railway**: Variables tab
  - **AWS**: Secrets Manager
  - **Docker**: Docker secrets or build args

### Additional Security

- API keys should have **minimal permissions** (read-only when possible)
- Use **different keys** for dev/staging/production
- Rotate keys every 90 days
- Enable IP restrictions if available
- Monitor API usage for anomalies
