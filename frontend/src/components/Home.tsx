import { useRoadmapStore } from "../store/roadmapStore";
import { Nav } from "./Nav";
import { Icon } from "./icons";

/**
 * Landing screen. Two creation paths — "Create with AI" (primary, → intake) and
 * "Create manually" (secondary, → manual-create modal). Both go through
 * `startCreation`, which enforces sign-in up front: logged-out users are routed
 * to login (with their chosen path stashed) before entering either flow, so they
 * never fill out an intake form or build a manual roadmap only to be bounced to
 * login afterwards.
 */
export function Home() {
  const startCreation = useRoadmapStore((s) => s.startCreation);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <span className="pf-pill">
            <span className="dot" />
            AI-powered learning paths
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-h1 font-bold tracking-tight text-text sm:text-display">
            Forge your path, in the right way
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-2">
            Tell Wayforge your goal, level, and weekly time. We map it into a
            structured, resource-backed roadmap — or build your own, node by node.
          </p>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-5 text-left sm:grid-cols-2">
            <button
              onClick={() => startCreation("intake")}
              className="pf-card pf-card--hover group relative overflow-hidden p-6 text-left"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-32 opacity-80"
                style={{
                  background:
                    "radial-gradient(420px 180px at 30% -10%, var(--accent-soft), transparent)",
                }}
              />
              <div className="relative">
                <span className="inline-flex rounded-pill bg-accent-soft px-2.5 py-1 font-mono text-eyebrow uppercase text-accent">
                  Recommended
                </span>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-on shadow-sm">
                  <Icon.spark />
                </div>
                <h3 className="mt-4 font-display text-h3 font-bold text-text">
                  Create with AI
                </h3>
                <p className="mt-2 text-sm text-text-2">
                  Answer a few quick questions. We&rsquo;ll generate a structured
                  roadmap with the right resources, in the right order.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Start with AI{" "}
                  <Icon.arrow className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>

            <button
              onClick={() => startCreation("manual")}
              className="pf-card pf-card--hover group relative overflow-hidden p-6 text-left"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-32 opacity-80"
                style={{
                  background:
                    "radial-gradient(420px 180px at 30% -10%, var(--surface-3), transparent)",
                }}
              />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong bg-surface-2 text-text-2">
                  <Icon.penPlus />
                </div>
                <h3 className="mt-4 font-display text-h3 font-bold text-text">
                  Create manually
                </h3>
                <p className="mt-2 text-sm text-text-2">
                  Start from a blank canvas and build your own roadmap, adding and
                  branching nodes exactly how you want.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                  Build my own{" "}
                  <Icon.arrow className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          </div>

          <section className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-5 text-left sm:grid-cols-3">
            <Feature
              icon={<Icon.target />}
              title="Personalized"
              body="Built around your goal, level, and weekly time budget — not a generic syllabus."
            />
            <Feature
              icon={<Icon.route />}
              title="Structured"
              body="Curated steps and resources, ordered for the fastest path to real progress."
            />
            <Feature
              icon={<Icon.edit />}
              title="Editable"
              body="Tweak, reorder, branch, or skip steps. Your roadmap adapts as you learn."
            />
          </section>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-text-3">
          <span>Built for self-directed learners</span>
          <span className="font-mono">wayforge.page</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="pf-card pf-card--hover p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
        {icon}
      </div>
      <h4 className="mt-4 font-display text-base font-bold text-text">{title}</h4>
      <p className="mt-1.5 text-sm text-text-2">{body}</p>
    </div>
  );
}
