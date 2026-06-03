import { useRoadmapStore } from "../store/roadmapStore";

/** Landing screen. Adapted from lovable-screens.tsx; wired to the store. */
export function Home() {
  const setView = useRoadmapStore((s) => s.setView);
  const user = useRoadmapStore((s) => s.user);

  // Logged-out visitors are routed through login first; logged-in users go
  // straight to the intake form.
  const startCta = user
    ? { label: "Create your roadmap", to: "intake" as const }
    : { label: "Login to create your roadmap", to: "login" as const };

  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            AI-powered learning paths
          </div>
          <h1 className="text-6xl font-semibold tracking-tight text-slate-900 sm:text-7xl">
            Pathfinder
          </h1>
          <p className="mt-4 text-xl text-slate-700">
            Your AI-guided path to any skill
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600">
            Tell Pathfinder what you want to learn, your current level, and how much
            time you can dedicate each week. We&rsquo;ll generate a structured,
            personalized roadmap with the right resources in the right order — so you
            stop guessing and start learning.
          </p>
          <div className="mt-10">
            <button
              onClick={() => setView(startCta.to)}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {startCta.label}
              <span aria-hidden className="ml-2">
                →
              </span>
            </button>
          </div>
        </div>

        <section className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon="◎"
            title="Personalized"
            body="Built around your goal, level, and weekly time budget — not a generic syllabus."
          />
          <Feature
            icon="✦"
            title="AI-generated"
            body="Curated steps and resources, ordered for the fastest path to real progress."
          />
          <Feature
            icon="✎"
            title="Editable"
            body="Tweak, reorder, or skip steps. Your roadmap adapts as you learn."
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}

/** Top-right auth controls: signed-in identity + sign out, or a sign-in link. */
function AuthHeader() {
  const user = useRoadmapStore((s) => s.user);
  const clearAuth = useRoadmapStore((s) => s.clearAuth);
  const setView = useRoadmapStore((s) => s.setView);

  return (
    <header className="flex items-center justify-end px-6 py-4">
      {user ? (
        <div className="flex items-center gap-3">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full border border-slate-200"
            />
          )}
          <span className="text-sm font-medium text-slate-700">
            {user.github_username}
          </span>
          <button
            onClick={() => {
              clearAuth();
              setView("home");
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setView("login")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          Sign in
        </button>
      )}
    </header>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
        <span aria-hidden className="text-lg">
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-6">
      <p className="text-center text-xs text-slate-500">
        Built for self-directed learners
      </p>
    </footer>
  );
}
