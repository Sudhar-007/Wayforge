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
  // the scaled-to-zero backend. Show a loading screen while it's in flight; on
  // success the store redirects to GitHub (page unloads), on failure it sets an
  // error and we drop back to the form. (Auth logic itself is unchanged.)
  const [connecting, setConnecting] = useState(false);

  const onGitHub = async () => {
    setConnecting(true);
    await initiateGitHubLogin();
    setConnecting(false); // only reached if the redirect didn't happen (failure)
  };

  if (connecting) {
    return <Loading messages={CONNECT_MESSAGES} subtitle={CONNECT_SUBTITLE} />;
  }

  return (
    <div className="min-h-screen">
      <TopBar onBack={() => setView("home")} backLabel="Home" />
      <main className="flex min-h-[calc(100vh-64px)] items-start justify-center px-6 pt-16">
        <div className="pf-card w-full max-w-[432px] p-9">
          <div className="flex justify-center">
            <span className="pf-pill">
              <span className="dot" />
              Welcome to Wayforge
            </span>
          </div>
          <h1 className="mt-4 text-center font-display text-h2 font-bold tracking-tight text-text">
            Sign in to continue
          </h1>
          <p className="mt-2 text-center text-sm text-text-2">
            Choose your preferred sign-in method below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-md border border-[#d64545]/30 bg-[#d64545]/10 px-4 py-3 text-sm text-[#d64545]"
            >
              {error}
            </div>
          )}

          <div className="mt-7 grid gap-2.5">
            <button
              disabled
              title="Coming soon"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-text-4 opacity-60"
            >
              <Icon.google />
              Continue with Google
              <span className="text-xs">soon</span>
            </button>
            <button
              onClick={() => void onGitHub()}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md bg-text px-4 text-sm font-semibold text-bg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Icon.github />
              Continue with GitHub
            </button>
            <button
              disabled
              title="Coming soon"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-text-4 opacity-60"
            >
              <Icon.linkedin />
              Continue with LinkedIn
              <span className="text-xs">soon</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-3">Secure authentication</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-xs leading-relaxed text-text-3">
            We only use your profile to identify you. We never post on your behalf
            and never share your data.
          </p>
        </div>
      </main>
    </div>
  );
}
