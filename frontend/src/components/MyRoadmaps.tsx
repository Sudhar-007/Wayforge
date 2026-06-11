import { useEffect, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import type { RoadmapListItem } from "../types/roadmap";
import { TopBar } from "./Nav";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { Icon } from "./icons";

/**
 * Lists the signed-in user's saved roadmaps as a responsive grid of cards, with
 * progress, continue, and delete actions. Loading / empty / list states.
 */
export function MyRoadmaps() {
  const myRoadmaps = useRoadmapStore((s) => s.myRoadmaps);
  const status = useRoadmapStore((s) => s.myRoadmapsStatus);
  const setView = useRoadmapStore((s) => s.setView);
  const loadMyRoadmaps = useRoadmapStore((s) => s.loadMyRoadmaps);

  useEffect(() => {
    void loadMyRoadmaps();
  }, [loadMyRoadmaps]);

  const loading = status === "loading";
  const isEmpty = !loading && myRoadmaps.length === 0;

  return (
    <div className="min-h-screen">
      <TopBar onBack={() => setView("home")} backLabel="Home" />
      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-h1 font-bold tracking-tight text-text">
              My roadmaps
            </h1>
            <p className="mt-2.5 text-lg text-text-2">
              Pick up where you left off, or start a new path.
            </p>
          </div>
          <button onClick={() => setView("home")} className="pf-btn pf-btn--primary">
            <Icon.plus /> New roadmap
          </button>
        </div>

        {status === "error" ? (
          <div
            role="alert"
            className="mt-10 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            Couldn&rsquo;t load your roadmaps. Please try again.
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : isEmpty ? (
          <EmptyState onCreate={() => setView("home")} />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myRoadmaps.map((item) => (
              <RoadmapCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RoadmapCard({ item }: { item: RoadmapListItem }) {
  const openRoadmap = useRoadmapStore((s) => s.openRoadmap);
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap);
  const renameRoadmapById = useRoadmapStore((s) => s.renameRoadmapById);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const subtitle = [item.topic, item.level].filter(Boolean).join(" · ");
  const created = new Date(item.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
    <div className="pf-card pf-card--hover flex flex-col p-5">
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
          className="pf-input font-display text-base font-bold"
          style={{ padding: "4px 10px" }}
          aria-label="Roadmap title"
        />
      ) : (
        <div className="group flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold text-text">
            {item.title}
          </h3>
          <button
            onClick={startEditing}
            title="Rename"
            aria-label="Rename roadmap"
            className="mt-0.5 shrink-0 rounded p-1 text-text-4 opacity-0 transition hover:text-text-2 focus:outline-none focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Icon.pencil />
          </button>
        </div>
      )}
      {subtitle && <p className="mt-1 text-sm text-text-2">{subtitle}</p>}
      <p className="mt-1 text-xs text-text-3">Created {created}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-text-2">
          <span>Progress</span>
          <span className="font-mono">{item.progress_percentage}%</span>
        </div>
        <div className="pf-progress mt-1.5">
          <i style={{ width: `${item.progress_percentage}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => void openRoadmap(item.id)}
          className="pf-btn pf-btn--primary flex-1"
        >
          {item.progress_percentage > 0 ? "Continue" : "Open"}
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          aria-label="Delete roadmap"
          title="Delete"
          className="pf-btn pf-btn--danger"
          style={{ width: 40, padding: 0 }}
        >
          <Icon.trash />
        </button>
      </div>

      {confirmingDelete && (
        <ConfirmDeleteModal
          title="Delete roadmap"
          body={
            <>
              Delete <span className="font-medium text-text">“{item.title}”</span>?
              Your progress on it will be lost. This can&rsquo;t be undone.
            </>
          }
          confirmLabel="Delete roadmap"
          onConfirm={() => {
            setConfirmingDelete(false);
            void deleteRoadmap(item.id);
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <p className="text-lg text-text-2">
        You haven&rsquo;t saved any roadmaps yet.
      </p>
      <button onClick={onCreate} className="pf-btn pf-btn--primary pf-btn--lg mt-6">
        Create your first roadmap <Icon.arrow />
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="pf-card p-5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-3" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-3" />
          <div className="mt-1 h-3 w-1/3 animate-pulse rounded bg-surface-3" />
          <div className="mt-5 h-1.5 w-full animate-pulse rounded-full bg-surface-3" />
          <div className="mt-5 h-9 w-full animate-pulse rounded-md bg-surface-3" />
        </div>
      ))}
    </div>
  );
}
