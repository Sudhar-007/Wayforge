import { useEffect } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { TopBar } from "./Nav";
import { Icon } from "./icons";

/**
 * Profile card: GitHub identity, a "connected" pill, lightweight stats computed
 * from the user's saved roadmaps, and sign-out. Not a dashboard.
 */
export function Profile() {
  const user = useRoadmapStore((s) => s.user);
  const setView = useRoadmapStore((s) => s.setView);
  const clearAuth = useRoadmapStore((s) => s.clearAuth);
  const myRoadmaps = useRoadmapStore((s) => s.myRoadmaps);
  const myRoadmapsStatus = useRoadmapStore((s) => s.myRoadmapsStatus);
  const loadMyRoadmaps = useRoadmapStore((s) => s.loadMyRoadmaps);

  // Lazily load the roadmap list (once) to back the stat cards.
  useEffect(() => {
    if (myRoadmapsStatus === "idle" && myRoadmaps.length === 0) {
      void loadMyRoadmaps();
    }
  }, [myRoadmapsStatus, myRoadmaps.length, loadMyRoadmaps]);

  if (!user) return null;

  const count = myRoadmaps.length;
  const avg = count
    ? Math.round(
        myRoadmaps.reduce((a, r) => a + r.progress_percentage, 0) / count,
      )
    : 0;

  return (
    <div className="min-h-screen">
      <TopBar onBack={() => setView("home")} backLabel="Home" />
      <main className="flex min-h-[calc(100vh-64px)] items-start justify-center px-6 pt-16">
        <div className="pf-card w-full max-w-[420px] p-9 text-center">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="mx-auto rounded-full border border-border object-cover"
              style={{ width: 88, height: 88 }}
            />
          ) : (
            <div className="mx-auto flex items-center justify-center rounded-full bg-surface-3 text-2xl font-semibold text-text-3" style={{ width: 88, height: 88 }}>
              {user.github_username.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="mt-4 font-display text-h2 font-bold tracking-tight text-text">
            {user.github_username}
          </h1>
          {user.email && <p className="mt-1 text-sm text-text-2">{user.email}</p>}

          <div className="mt-4 inline-flex">
            <span className="pf-pill">
              <span className="dot" />
              <Icon.github width={13} height={13} /> Connected to GitHub
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Stat n={String(count)} label="Roadmaps" />
            <Stat n={`${avg}%`} label="Avg. progress" />
          </div>

          <button
            onClick={() => {
              clearAuth();
              setView("home");
            }}
            className="pf-btn pf-btn--danger pf-btn--block mt-6"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-3.5">
      <div className="font-display text-h3 font-bold text-text">{n}</div>
      <div className="mt-0.5 text-xs text-text-3">{label}</div>
    </div>
  );
}
