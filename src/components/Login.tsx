import { useRoadmapStore } from "../store/roadmapStore";

/**
 * Login screen. Design ported from the Lovable prototype (src/lovable.tsx),
 * wired to the real auth flow:
 *   - "Continue with GitHub" → initiateGitHubLogin() (redirects to GitHub OAuth)
 *   - Google / LinkedIn are intentionally disabled ("coming soon") — not yet
 *     implemented (skip Google/LinkedIn OAuth for now).
 */
export function Login() {
  const initiateGitHubLogin = useRoadmapStore((s) => s.initiateGitHubLogin);
  const setView = useRoadmapStore((s) => s.setView);
  const error = useRoadmapStore((s) => s.generationError);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-10">
      <div className="w-full max-w-[440px]">
        <button
          onClick={() => setView("home")}
          className="inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:underline"
        >
          ← Back to home
        </button>
      </div>
      <div className="mt-6 flex w-full max-w-[440px] flex-1 items-start justify-center">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Welcome to Pathfinder
            </span>
          </div>
          <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
            Sign in to continue
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Choose your preferred sign-in method below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              disabled
              title="Coming soon"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-400 opacity-60"
            >
              <GoogleIcon />
              Continue with Google
              <span className="text-xs">(coming soon)</span>
            </button>
            <button
              onClick={() => void initiateGitHubLogin()}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <GithubIcon />
              Continue with GitHub
            </button>
            <button
              disabled
              title="Coming soon"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg px-4 text-sm font-medium text-white opacity-60"
              style={{ backgroundColor: "#0A66C2" }}
            >
              <LinkedInIcon />
              Continue with LinkedIn
              <span className="text-xs">(coming soon)</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">Secure authentication</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-xs leading-relaxed text-slate-500">
            We only use your profile to identify you. We never post on your behalf
            and never share your data.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.15-.02-2.09-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.45 3.11-1.15 3.11-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.28-5.15 5.55.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.06 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z" />
    </svg>
  );
}
