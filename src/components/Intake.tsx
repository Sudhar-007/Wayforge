import { useEffect } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { TopBar } from "./Nav";
import { Icon } from "./icons";

/** 5-question intake form. Restyled to the Wayforge spec; all state and submit
 * behaviour live in the Zustand store and drive the real backend pipeline. */
export function Intake() {
  const form = useRoadmapStore((s) => s.form);
  const setForm = useRoadmapStore((s) => s.setForm);
  const setView = useRoadmapStore((s) => s.setView);
  const generateRoadmap = useRoadmapStore((s) => s.generateRoadmap);
  const generationError = useRoadmapStore((s) => s.generationError);
  const fetchLimits = useRoadmapStore((s) => s.fetchLimits);
  const generationLimits = useRoadmapStore((s) => s.generationLimits);

  // Pull the remaining-generations count from the backend on mount (source of
  // truth — never counted client-side). Also warms the scaled-to-zero backend.
  useEffect(() => {
    void fetchLimits();
  }, [fetchLimits]);

  const canSubmit = form.topic.trim().length > 0 && form.goal.trim().length > 0;

  const levels = ["Beginner", "Intermediate", "Advanced"] as const;
  const weeks = ["1-3 hours", "4-7 hours", "8-15 hours", "15+ hours"];

  // Non-blocking heads-up when the user is near a lockout. Hour binds before day.
  const limitWarning = (() => {
    if (!generationLimits) return null;
    const { hour, day } = generationLimits;
    if (hour.remaining <= 1)
      return hour.remaining === 0
        ? "You've used all your roadmap generations this hour."
        : "1 roadmap generation left this hour.";
    if (day.remaining <= 1)
      return day.remaining === 0
        ? "You've used all your roadmap generations today."
        : "1 roadmap generation left today.";
    return null;
  })();

  return (
    <div className="min-h-screen">
      <TopBar onBack={() => setView("home")} backLabel="Home" />
      <main className="mx-auto w-full max-w-2xl px-6 pb-20 pt-14">
        <span className="t-eyebrow">Create with AI · Step 1 of 1</span>
        <h1 className="mt-3.5 font-display text-h1 font-bold tracking-tight text-text">
          Tell us about your learning goal
        </h1>
        <p className="mt-3 text-lg text-text-2">
          A few quick questions so Wayforge can shape a roadmap that actually fits
          you.
        </p>

        {limitWarning && (
          <div
            role="status"
            className="mt-6 rounded-md border border-status-in-progress/40 bg-status-in-progress/10 px-4 py-3 text-sm text-text"
          >
            {limitWarning}
          </div>
        )}

        {generationError && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-[#d64545]/30 bg-[#d64545]/10 px-4 py-3 text-sm text-[#d64545]"
          >
            {generationError}
          </div>
        )}

        <form
          className="mt-10 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void generateRoadmap();
          }}
        >
          <Field label="What do you want to learn?" htmlFor="topic">
            <input
              id="topic"
              type="text"
              className="pf-input"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Machine Learning, Frontend Development, Cybersecurity"
              required
            />
          </Field>

          <Field label="What's your current level?">
            <div className="pf-seg" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {levels.map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  className="pf-seg-item"
                  data-active={form.level === lvl}
                  onClick={() => setForm({ ...form, level: lvl })}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </Field>

          <Field label="How much time can you dedicate weekly?">
            <div
              className="pf-seg"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
            >
              {weeks.map((w) => (
                <button
                  type="button"
                  key={w}
                  className="pf-seg-item"
                  data-active={form.weekly === w}
                  onClick={() => setForm({ ...form, weekly: w })}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>

          <Field label="What's your end goal?" htmlFor="goal">
            <input
              id="goal"
              type="text"
              className="pf-input"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="e.g. Get a job as an ML engineer, Build a side project"
              required
            />
          </Field>

          <Field
            label="Any specific topics or technologies to focus on?"
            htmlFor="focus"
            hint="Optional"
          >
            <textarea
              id="focus"
              className="pf-textarea"
              rows={3}
              value={form.focus}
              onChange={(e) => setForm({ ...form, focus: e.target.value })}
              placeholder="e.g. I already know Python and want to focus on deep learning frameworks"
            />
          </Field>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="pf-btn pf-btn--primary pf-btn--lg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit}
            >
              Generate roadmap <Icon.arrow />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="pf-label" style={{ margin: 0 }}>
          {label}
        </label>
        {hint && <span className="pf-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
