import { useEffect } from "react";

/**
 * Small confirmation modal shown when saving a roadmap that's already saved and
 * has unsaved edits. Lets the user overwrite the existing row or fork a new copy.
 * Closes on backdrop click, Escape, or Cancel.
 */
export function SaveChoiceModal({
  onUpdate,
  onSaveNew,
  onCancel,
}: {
  onUpdate: () => void;
  onSaveNew: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-choice-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="save-choice-title"
          className="text-base font-semibold text-slate-900"
        >
          Save changes
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This roadmap is already saved. Update the saved version, or keep it and
          save these changes as a new copy?
        </p>

        <div className="mt-6 space-y-2">
          <button
            onClick={onUpdate}
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Update saved roadmap
          </button>
          <button
            onClick={onSaveNew}
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Save as new copy
          </button>
          <button
            onClick={onCancel}
            className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
