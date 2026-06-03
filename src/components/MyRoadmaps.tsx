import { useEffect, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import type { RoadmapListItem } from "../types/roadmap";

/**
 * Lists the signed-in user's saved roadmaps as a responsive grid of cards, with
 * progress, continue, and delete actions. Loading / empty / list states.
 */
export function MyRoadmaps() {
  const myRoadmaps = useRoadmapStore((s) => s.myRoadmaps);
  const status = useRoadmapStore((s) => s.myRoadmapsStatus);
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const setView = useRoadmapStore((s) => s.setView);
  const loadMyRoadmaps = useRoadmapStore((s) => s.loadMyRoadmaps);

  useEffect(() => {
    void loadMyRoadmaps();
  }, [loadMyRoadmaps]);

  // Return to the viewer if a roadmap is open, otherwise home.
  const back = () => setView(roadmap ? "viewer" : "home");

  const loading = status === "loading";
  const isEmpty = !loading && myRoadmaps.length === 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-16 pt-16">
      <div>
        <button
          onClick={back}
          className="inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:underline"
        >
          ← Back
        </button>
      </div>

      <header className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          My Roadmaps
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick up where you left off, or start a new path.
        </p>
      </header>

      {status === "error" ? (
        <div
          role="alert"
          className="mt-10 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Couldn&rsquo;t load your roadmaps. Please try again.
        </div>
      ) : loading ? (
        <SkeletonGrid />
      ) : isEmpty ? (
        <EmptyState onCreate={() => setView("intake")} />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myRoadmaps.map((item) => (
            <RoadmapCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ item }: { item: RoadmapListItem }) {
  const openRoadmap = useRoadmapStore((s) => s.openRoadmap);
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap);
  const renameRoadmapById = useRoadmapStore((s) => s.renameRoadmapById);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);

  const subtitle = [item.topic, item.level].filter(Boolean).join(" · ");
  const created = new Date(item.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const onDelete = () => {
    if (window.confirm(`Delete "${item.title}"? This can't be undone.`)) {
      void deleteRoadmap(item.id);
    }
  };

  const startEditing = () => {
    setDraft(item.title);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.title) {
      void renameRoadmapById(item.id, draft);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-base font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Roadmap title"
        />
      ) : (
        <div className="group flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
          <button
            onClick={startEditing}
            title="Rename"
            aria-label="Rename roadmap"
            className="mt-0.5 shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:text-slate-600 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-500 group-hover:opacity-100"
          >
            <PencilIcon />
          </button>
        </div>
      )}
      {subtitle && (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">Created {created}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Progress</span>
          <span>{item.progress_percentage}% complete</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{ width: `${item.progress_percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => void openRoadmap(item.id)}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Continue
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <p className="text-base text-slate-700">
        You haven&rsquo;t saved any roadmaps yet.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Create your first roadmap
        <span aria-hidden className="ml-2">
          →
        </span>
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mt-1 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-9 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
