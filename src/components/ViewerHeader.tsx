import { useRoadmapStore } from "../store/roadmapStore";
import { Legend } from "./Legend";

/** Styled header above the roadmap viewer. Adapted from lovable-screens.tsx
 * (header only — the dotted placeholder is replaced by the real React Flow
 * canvas in App). */
export function ViewerHeader() {
  const setView = useRoadmapStore((s) => s.setView);
  const topic = useRoadmapStore((s) => s.form.topic);

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

      <Legend />
    </header>
  );
}
