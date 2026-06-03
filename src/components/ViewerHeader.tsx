import { useRoadmapStore } from "../store/roadmapStore";
import { Legend } from "./Legend";

/** Shared base styling for a header button — keeps the two buttons consistent. */
const BTN_BASE =
  "mt-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

/** Per-status styling and label for the logged-in save button. */
const SAVE_LABELS: Record<string, string> = {
  idle: "Save Roadmap",
  saving: "Saving…",
  saved: "Saved ✓",
  error: "Save failed — retry",
};

const SAVE_STYLES: Record<string, string> = {
  idle: "bg-indigo-600 text-white hover:bg-indigo-700",
  saving: "bg-indigo-600 text-white opacity-70 cursor-not-allowed",
  saved: "bg-emerald-600 text-white cursor-default",
  error: "bg-red-600 text-white hover:bg-red-700",
};

/** Styled header above the roadmap viewer. Adapted from lovable-screens.tsx
 * (header only — the dotted placeholder is replaced by the real React Flow
 * canvas in App). */
export function ViewerHeader() {
  const setView = useRoadmapStore((s) => s.setView);
  const topic = useRoadmapStore((s) => s.form.topic);
  const user = useRoadmapStore((s) => s.user);
  const saveStatus = useRoadmapStore((s) => s.saveStatus);
  const saveRoadmapToAccount = useRoadmapStore((s) => s.saveRoadmapToAccount);

  const saveDisabled = saveStatus === "saving" || saveStatus === "saved";

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 pb-6 pt-8">
      <div className="flex items-start gap-4">
        <button
          onClick={() => setView("intake")}
          className="mt-1 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          ← New Roadmap
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your Learning Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-600">{topic || "Your topic"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={() => void saveRoadmapToAccount()}
            disabled={saveDisabled}
            className={`${BTN_BASE} ${SAVE_STYLES[saveStatus]}`}
          >
            {SAVE_LABELS[saveStatus]}
          </button>
        ) : (
          <button
            onClick={() => setView("login")}
            className={`${BTN_BASE} border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50`}
          >
            Sign in to save
          </button>
        )}
        <Legend />
      </div>
    </header>
  );
}
