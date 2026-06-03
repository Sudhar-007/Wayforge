import { useRoadmapStore } from "../store/roadmapStore";

/**
 * Minimal profile card: GitHub avatar, username, email, a "connected" pill, and
 * a sign-out action. Not a dashboard — just the signed-in identity.
 */
export function Profile() {
  const user = useRoadmapStore((s) => s.user);
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const setView = useRoadmapStore((s) => s.setView);
  const clearAuth = useRoadmapStore((s) => s.clearAuth);

  // Return to the viewer if a roadmap is open, otherwise home.
  const back = () => setView(roadmap ? "viewer" : "home");

  if (!user) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-16">
      <div>
        <button
          onClick={back}
          className="inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:underline"
        >
          ← Back
        </button>
      </div>

      <div className="mt-10 flex flex-1 items-start justify-center">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="mx-auto h-24 w-24 rounded-full border border-slate-200"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-500">
              {user.github_username.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            {user.github_username}
          </h1>
          {user.email && (
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          )}

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <GithubIcon />
            Connected to GitHub
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                clearAuth();
                setView("home");
              }}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.15-.02-2.09-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.45 3.11-1.15 3.11-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.28-5.15 5.55.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.06 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  );
}
