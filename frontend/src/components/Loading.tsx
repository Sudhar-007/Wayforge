import { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Understanding your goals…",
  "Searching the best learning resources…",
  "Ranking content for your level…",
  "Building your personalized roadmap…",
];

const DEFAULT_SUBTITLE = "This usually takes a few seconds.";

interface LoadingProps {
  /** Rotating status lines. Pass a stable (module-scope) array. */
  messages?: string[];
  /** Smaller line under the rotating message. */
  subtitle?: string;
}

/**
 * Full-screen loading state with a spinner, a rotating message, and an
 * indeterminate bar. Used both while the generation pipeline runs (default copy)
 * and during the OAuth callback's token exchange (auth copy passed in). Purely
 * presentational — the caller decides when to stop rendering it.
 */
export function Loading({
  messages = DEFAULT_MESSAGES,
  subtitle = DEFAULT_SUBTITLE,
}: LoadingProps) {
  const [idx, setIdx] = useState(0);
  const count = messages.length;

  useEffect(() => {
    const interval = setInterval(() => setIdx((n) => (n + 1) % count), 2000);
    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="t-eyebrow" role="status" aria-label="Loading">
        Working
      </p>
      <p
        key={idx}
        className="mt-4 font-display text-h3 font-bold text-text transition-opacity duration-300"
        aria-live="polite"
      >
        {messages[idx % count]}
      </p>
      <p className="mt-2 text-sm text-text-3">{subtitle}</p>
      <div className="mt-8 h-px w-64 overflow-hidden bg-border">
        <span className="block h-full w-2/5 animate-[wf-load_1.4s_ease-in-out_infinite] bg-accent" />
      </div>
    </div>
  );
}
