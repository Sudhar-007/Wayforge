import { useRoadmapStore } from "../store/roadmapStore";
import { Nav } from "./Nav";
import { Icon } from "./icons";
import { RecentRoadmapPreviewCard } from "./RecentRoadmapPreviewCard";

/**
 * Landing screen. Two creation paths — "Generate with AI" (primary, → intake)
 * and "Build by hand" (secondary, → manual-create modal). Both go through
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
        {/* Hero — centered editorial statement with the specimen beneath */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-16 text-center sm:pt-20">
          <p className="t-eyebrow">Roadmaps for self-directed learners</p>
          <h1 className="mx-auto mt-5 font-display text-h1 font-extrabold tracking-tight text-text sm:text-display">
            Learn anything.
            <br />
            In the right order.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-text-2">
            Wayforge turns a goal into a structured, resource-backed
            roadmap — a path you can edit, track, and make your own.
          </p>

          <div className="mx-auto mt-12 hidden w-full max-w-sm text-left sm:block">
            <RecentRoadmapPreviewCard />
          </div>

          {/* Creation paths — two list-rows in a hairline frame, not cards */}
          <div className="mx-auto mt-14 max-w-2xl divide-y divide-border border-y border-border text-left">
            <PathRow
              index="01"
              title="Generate with AI"
              body="Five questions. A complete, ordered curriculum with vetted resources."
              onClick={() => startCreation("intake")}
              primary
            />
            <PathRow
              index="02"
              title="Build by hand"
              body="A blank canvas. Add, branch, and connect every step yourself."
              onClick={() => startCreation("manual")}
            />
          </div>
        </section>

        {/* Principles — Swiss numbered columns over hairlines */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16 sm:pt-20">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            <Principle
              n="01"
              title="Personal"
              body="Shaped by your level and the hours you actually have each week."
            />
            <Principle
              n="02"
              title="Ordered"
              body="Dependencies mapped, so prerequisites always come first."
            />
            <Principle
              n="03"
              title="Yours"
              body="Rename, reroute, branch, or skip — the map adapts as you learn."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-text-3">
          <span>Wayforge — built for self-directed learners</span>
          <span className="font-mono">wayforge.page</span>
        </div>
      </footer>
    </div>
  );
}

/** A creation-path row: mono index, title, body, arrow. Whole row is the button. */
function PathRow({
  index,
  title,
  body,
  onClick,
  primary = false,
}: {
  index: string;
  title: string;
  body: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-baseline gap-6 px-1 py-6 text-left transition-colors hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 sm:px-3"
    >
      <span className="font-mono text-xs text-text-4">{index}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2.5 font-display text-h3 font-bold text-text">
          {title}
          {primary && (
            <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-accent">
              Recommended
            </span>
          )}
        </span>
        <span className="mt-1.5 block text-sm text-text-2">{body}</span>
      </span>
      <span className="self-center text-text-3 transition-transform group-hover:translate-x-1 group-hover:text-text">
        <Icon.arrow />
      </span>
    </button>
  );
}

function Principle({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border-t border-border-strong pt-4">
      <div className="flex items-baseline justify-between">
        <h4 className="font-display text-base font-bold text-text">{title}</h4>
        <span className="font-mono text-xs text-text-4">{n}</span>
      </div>
      <p className="mt-2 max-w-[34ch] text-sm text-text-2">{body}</p>
    </div>
  );
}

