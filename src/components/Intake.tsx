import { useEffect } from "react";
import { useRoadmapStore } from "../store/roadmapStore";

/** 5-question intake form. Adapted from lovable-screens.tsx; state lives in the
 * Zustand store and submit kicks off the real backend pipeline. */
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

  const canSubmit =
    form.topic.trim().length > 0 && form.goal.trim().length > 0;

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <div>
        <button
          onClick={() => setView("home")}
          className="inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:underline"
        >
          ← Back
        </button>
      </div>

      <header className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Tell us about your learning goal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          A few quick questions so we can shape a roadmap that actually fits you.
        </p>
      </header>

      {limitWarning && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {limitWarning}
        </div>
      )}

      {generationError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {generationError}
        </div>
      )}

      <form
        className="mt-10 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void generateRoadmap();
        }}
      >
        <Field label="What do you want to learn?" htmlFor="topic">
          <input
            id="topic"
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g., Machine Learning, Frontend Development, Cybersecurity"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </Field>

        <Field label="What's your current level?">
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => {
              const active = form.level === lvl;
              return (
                <label
                  key={lvl}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={lvl}
                    checked={active}
                    onChange={() => setForm({ ...form, level: lvl })}
                    className="sr-only"
                  />
                  {lvl}
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="How much time can you dedicate weekly?" htmlFor="weekly">
          <select
            id="weekly"
            value={form.weekly}
            onChange={(e) => setForm({ ...form, weekly: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option>1-3 hours</option>
            <option>4-7 hours</option>
            <option>8-15 hours</option>
            <option>15+ hours</option>
          </select>
        </Field>

        <Field label="What's your end goal?" htmlFor="goal">
          <input
            id="goal"
            type="text"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="e.g., Get a job as an ML engineer, Build a side project, Pass a certification"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </Field>

        <Field
          label="Any specific topics or technologies you want to focus on?"
          htmlFor="focus"
          hint="Optional"
        >
          <textarea
            id="focus"
            value={form.focus}
            onChange={(e) => setForm({ ...form, focus: e.target.value })}
            placeholder="e.g., I already know Python and want to focus on deep learning frameworks"
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </Field>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Generate Roadmap
          </button>
        </div>
      </form>
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
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-900"
        >
          {label}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
