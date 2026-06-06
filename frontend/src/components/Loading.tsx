import { useEffect, useState } from "react";

const MESSAGES = [
  "Understanding your goals…",
  "Searching the best learning resources…",
  "Ranking content for your level…",
  "Building your personalized roadmap…",
];

/**
 * Loading screen shown while the backend pipeline runs. The transition out of
 * this view is driven entirely by `generateRoadmap` resolving (→ viewer on
 * success, → intake on failure); the rotating message + bar below are pure UI.
 */
export function Loading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIdx((n) => (n + 1) % MESSAGES.length),
      2000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-surface-3 border-t-accent"
        role="status"
        aria-label="Loading"
      />
      <p
        key={idx}
        className="mt-6 text-lg font-semibold text-text transition-opacity duration-300"
        aria-live="polite"
      >
        {MESSAGES[idx]}
      </p>
      <p className="mt-1.5 text-sm text-text-3">
        This usually takes a few seconds.
      </p>
      <div className="mt-7 h-1.5 w-56 overflow-hidden rounded-pill bg-surface-3">
        <span className="block h-full w-2/5 animate-[wf-load_1.4s_ease-in-out_infinite] rounded-pill bg-accent" />
      </div>
    </div>
  );
}
