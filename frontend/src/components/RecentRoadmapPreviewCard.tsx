import { useEffect, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import type { Roadmap, RoadmapNode } from "../types/roadmap";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type StepState = "done" | "active" | "todo" | "optional";

interface PreviewStep {
  label: string;
  state: StepState;
}

/**
 * Homepage mini-roadmap card. Signed-out (or empty/error/loading) it renders
 * the static demo specimen; signed in with at least one saved roadmap it shows
 * a simple linear preview of the most recently edited one (the list endpoint
 * orders by updated_at desc) and opens it in the viewer on click. Branches are
 * deliberately not visualized here — array order stands in for the main path.
 */
export function RecentRoadmapPreviewCard() {
  const user = useRoadmapStore((s) => s.user);
  const token = useRoadmapStore((s) => s.token);
  const myRoadmaps = useRoadmapStore((s) => s.myRoadmaps);
  const myRoadmapsStatus = useRoadmapStore((s) => s.myRoadmapsStatus);
  const loadMyRoadmaps = useRoadmapStore((s) => s.loadMyRoadmaps);
  const openRoadmap = useRoadmapStore((s) => s.openRoadmap);

  // Lazily load the user's roadmap list (same pattern as Profile). `requested`
  // distinguishes "idle because we haven't asked yet" (→ skeleton) from "idle
  // because the load finished and the list is genuinely empty" (→ demo card).
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (user && myRoadmapsStatus === "idle" && myRoadmaps.length === 0 && !requested) {
      setRequested(true);
      void loadMyRoadmaps();
    }
  }, [user, myRoadmapsStatus, myRoadmaps.length, requested, loadMyRoadmaps]);

  const recent = user ? myRoadmaps[0] : undefined;

  // Fetch the full document of the most recent roadmap (the list rows omit
  // `data`, which holds the nodes we preview). Local state on purpose — this
  // is presentation-only and shouldn't live in the global store.
  const [doc, setDoc] = useState<Roadmap | null>(null);
  const [docFailed, setDocFailed] = useState(false);

  useEffect(() => {
    if (!recent || !token) return;
    let cancelled = false;
    setDoc(null);
    setDocFailed(false);
    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/roadmaps/${recent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Preview fetch failed (${res.status})`);
        const saved = await res.json();
        if (!cancelled) setDoc(saved.data as Roadmap);
      } catch {
        if (!cancelled) setDocFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recent?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const listPending =
    !!user &&
    (myRoadmapsStatus === "loading" ||
      (myRoadmapsStatus === "idle" && myRoadmaps.length === 0 && !requested));

  // Demo card for everyone without a live preview: signed out, list known to
  // be empty, any fetch error, or a roadmap with no learnable nodes.
  const steps = doc ? buildPreviewSteps(doc.nodes) : null;
  if (!listPending && (!recent || docFailed || (doc && (!steps || steps.length === 0)))) {
    return <DemoSpecimen />;
  }

  // Loading (list or document) — skeleton with the same footprint.
  if (listPending || !doc || !steps) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-3" />
        <div className="mt-6 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-[11px] w-[11px] animate-pulse rounded-full bg-surface-3" />
              <div className="h-3 flex-1 animate-pulse rounded bg-surface-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recent || steps.length === 0) return <DemoSpecimen />;

  const branchCount = countBranches(doc);

  return (
    <button
      onClick={() => void openRoadmap(recent.id)}
      aria-label={`Continue roadmap: ${recent.title}`}
      className="block w-full cursor-pointer rounded-lg border border-border bg-surface p-5 text-left transition-colors transition-shadow hover:border-border-strong hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="flex items-baseline justify-between gap-4 font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-text-3">
        <span className="truncate">Roadmap — {recent.title}</span>
        <span className="shrink-0 text-accent">
          {recent.progress_percentage}%
        </span>
      </div>
      <div className="mt-5 flex flex-col">
        {steps.map((s, i) => (
          <StepRow key={`${s.label}-${i}`} step={s} last={i === steps.length - 1} />
        ))}
      </div>
      {branchCount > 0 && (
        <div className="mt-4 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-4">
          {branchCount} {branchCount === 1 ? "branch" : "branches"} in the full map
        </div>
      )}
    </button>
  );
}

/**
 * Reduce a roadmap to ≤5 linear steps: skip section headers and skipped nodes,
 * treat array order as the main path (no branch traversal), and window around
 * the current step — up to 2 recently completed, the active one, then upcoming.
 */
function buildPreviewSteps(nodes: RoadmapNode[]): PreviewStep[] {
  const learnable = nodes.filter(
    (n) => n.type !== "section_header" && n.status !== "skipped",
  );
  if (learnable.length === 0) return [];

  // Current = first in-progress node, else the first untouched one.
  let currentIdx = learnable.findIndex((n) => n.status === "in_progress");
  if (currentIdx === -1)
    currentIdx = learnable.findIndex((n) => n.status === "not_started");

  // Everything completed → show the last 5, all done, no NOW.
  if (currentIdx === -1) {
    return learnable.slice(-5).map((n) => ({ label: n.title, state: "done" }));
  }

  const before = Math.min(2, currentIdx);
  const start = currentIdx - before;
  const windowed = learnable.slice(start, start + 5);

  return windowed.map((n, i) => {
    const idx = start + i;
    if (idx === currentIdx) return { label: n.title, state: "active" as const };
    if (n.status === "completed") return { label: n.title, state: "done" as const };
    return { label: n.title, state: "todo" as const };
  });
}

/** Branches = learnable nodes that fan out to more than one child. */
function countBranches(doc: Roadmap): number {
  const outDegree = new Map<string, number>();
  for (const e of doc.edges) {
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
  }
  let count = 0;
  for (const n of doc.nodes) {
    if (n.type !== "section_header" && (outDegree.get(n.id) ?? 0) > 1) count++;
  }
  return count;
}

function StepRow({ step, last }: { step: PreviewStep; last: boolean }) {
  return (
    <div className="relative flex items-center gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
      <Marker state={step.state} />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          step.state === "active"
            ? "font-medium text-text"
            : step.state === "todo"
              ? "text-text-3"
              : step.state === "optional"
                ? "text-text-4"
                : "text-text-2"
        }`}
      >
        {step.label}
      </span>
      {step.state === "active" && (
        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-status-in-progress">
          Now
        </span>
      )}
      {step.state === "optional" && (
        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-4">
          Opt
        </span>
      )}
    </div>
  );
}

/** Static product specimen shown when there's no live roadmap to preview. */
function DemoSpecimen() {
  const steps: PreviewStep[] = [
    { label: "Python fundamentals", state: "done" },
    { label: "NumPy & Pandas", state: "done" },
    { label: "Classical ML", state: "active" },
    { label: "Deep learning", state: "todo" },
    { label: "MLOps", state: "optional" },
  ];

  return (
    <div aria-hidden className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-text-3">
        <span>Roadmap — ML.01</span>
        <span className="text-accent">42%</span>
      </div>
      <div className="mt-5 flex flex-col">
        {steps.map((s, i) => (
          <StepRow key={s.label} step={s} last={i === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function Marker({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="z-10 flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full bg-accent" />
    );
  }
  if (state === "active") {
    return (
      <span className="z-10 h-[11px] w-[11px] shrink-0 rounded-full border-[2.5px] border-status-in-progress bg-surface" />
    );
  }
  if (state === "optional") {
    return (
      <span className="z-10 h-[11px] w-[11px] shrink-0 rounded-full border border-dashed border-border-strong bg-surface" />
    );
  }
  return (
    <span className="z-10 h-[11px] w-[11px] shrink-0 rounded-full border-[1.5px] border-border-strong bg-surface" />
  );
}
