import { useEffect, useState } from "react";

const MESSAGES = [
  "Understanding your goals...",
  "Searching the best learning resources...",
  "Ranking content for your level...",
  "Building your personalized roadmap...",
];

/**
 * Loading screen shown while the backend pipeline runs. Adapted from
 * lovable-screens.tsx. The auto-dismiss `setTimeout(onDone, 12000)` was removed
 * on purpose — the transition out of this view is driven entirely by
 * `generateRoadmap` resolving (→ viewer on success, → intake on failure). The
 * rotating-message interval below is pure UI animation.
 */
export function Loading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIdx((n) => (n + 1) % MESSAGES.length),
      3000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
          role="status"
          aria-label="Loading"
        />
        <p
          key={idx}
          className="mt-6 text-sm font-medium text-slate-700 transition-opacity duration-300"
          aria-live="polite"
        >
          {MESSAGES[idx]}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}
