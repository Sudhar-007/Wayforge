import { useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { TopBar } from "./Nav";
import { Loading } from "./Loading";
import { Icon } from "./icons";

// Stable (module-scope) copy for the connect-loading state.
const CONNECT_MESSAGES = ["Connecting to GitHub…"];
const CONNECT_SUBTITLE =
  "Waking up the server — this can take a few seconds on the first visit.";

/**
 * Login screen. Wired to the real auth flow:
 *   - "Continue with GitHub" → initiateGitHubLogin() (redirects to GitHub OAuth)
 *   - Google / LinkedIn are intentionally disabled ("coming soon").
 */
export function Login() {
  const initiateGitHubLogin = useRoadmapStore((s) => s.initiateGitHubLogin);
  const setView = useRoadmapStore((s) => s.setView);
  const error = useRoadmapStore((s) => s.generationError);

  // `/auth/github` is the first backend call in the flow, so it's what cold-starts
  // the scaled-to-zero backend (the store retries through the wake-up, which can
  // take ~30s). Show a loading screen while it's in flight; on success the store
  // redirects to GitHub (page unloads), on failure it sets an error and we drop
  // back to the form. The `finally` matters: without it a rejected request would
  // leave this screen stuck on "Connecting to GitHub…" forever.
  const [connecting, setConnecting] = useState(false);

  const onGitHub = async () => {
    setConnecting(true);
    try {
      await initiateGitHubLogin();
    } finally {
      setConnecting(false); // only reached if the redirect didn't happen
    }
  };

  if (connecting) {
    return <Loading messages={CONNECT_MESSAGES} subtitle={CONNECT_SUBTITLE} />;
  }

  return (
    <div className="min-h-screen">
      <TopBar onBack={() => setView("home")} backLabel="Home" />
      <main className="flex min-h-[calc(100vh-64px)] items-start justify-center px-6 pt-20">
        <div className="w-full max-w-[400px]">
          <p className="t-eyebrow">Account</p>
          <h1 className="mt-3 font-display text-h2 font-bold tracking-tight text-text">
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Your roadmaps and progress, saved to your account.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-2.5">
            <button
              onClick={() => void onGitHub()}
              className="pf-btn pf-btn--primary pf-btn--lg pf-btn--block"
            >
              <Icon.github />
              Continue with GitHub
            </button>
            <button
              disabled
              title="Coming soon"
              className="pf-btn pf-btn--secondary pf-btn--lg pf-btn--block cursor-not-allowed opacity-50"
            >
              <Icon.google />
              Continue with Google
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-4">
                Soon
              </span>
            </button>
            <button
              disabled
              title="Coming soon"
              className="pf-btn pf-btn--secondary pf-btn--lg pf-btn--block cursor-not-allowed opacity-50"
            >
              <Icon.linkedin />
              Continue with LinkedIn
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-4">
                Soon
              </span>
            </button>
          </div>

          <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-text-3">
            We only use your profile to identify you. We never post on your
            behalf and never share your data.
          </p>
        </div>
      </main>
    </div>
  );
}
