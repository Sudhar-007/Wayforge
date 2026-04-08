# Security Guide

## API Keys & Environment Variables

This project uses **Doppler** for secure secret management. Never commit API keys directly.

### Setup for Development

1. **Install Doppler CLI**
   ```bash
   # Windows (PowerShell)
   scoop install doppler

   # Mac
   brew install doppler

   # Or download from: https://doppler.com/docs/install-cli
   ```

2. **Login to Doppler**
   ```bash
   doppler login
   ```

3. **Setup Doppler for this project**
   ```bash
   cd PathFinder/backend
   doppler setup
   ```

4. **Add your secrets to Doppler**
   ```bash
   doppler secrets set SERPER_API_KEY=your_key_here
   ```

5. **Run the backend with Doppler**
   ```bash
   doppler run -- python main.py
   ```

### Required Environment Variables

- `SERPER_API_KEY`: API key for Serper (Google Search API)
  - Get it from: https://serper.dev/

### What's Protected

✅ **Safe to commit:**
- All `.py` files (use `os.environ.get()`)
- Configuration files without secrets
- `.gitignore`

❌ **NEVER commit:**
- `.env` files
- Any file with `API_KEY` or `SECRET` in plain text
- Doppler configuration files (`.doppler.yaml`)
- Shell scripts with hardcoded keys

### Before Pushing to GitHub

Run this checklist:

```bash
# 1. Check for accidentally committed secrets
git secrets --scan

# 2. Check .gitignore is working
git status

# 3. Verify no .env files are staged
git ls-files | grep .env

# 4. Search for potential API keys in code
grep -r "API_KEY.*=" . --include="*.py" | grep -v "os.environ"
```

### If You Accidentally Commit a Secret

1. **Immediately revoke the API key** at the provider (Serper)
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

- Use Doppler's CI/CD integrations
- Never use `set` or `export` in deployment scripts
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
