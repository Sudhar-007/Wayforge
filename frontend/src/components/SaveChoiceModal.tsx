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
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-choice-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg"
      >
        <h2
          id="save-choice-title"
          className="font-display text-h3 font-bold text-text"
        >
          Save changes
        </h2>
        <p className="mt-2 text-sm text-text-2">
          This roadmap is already saved. Update the saved version, or keep it and
          save these changes as a new copy?
        </p>

        <div className="mt-6 space-y-2.5">
          <button onClick={onUpdate} className="pf-btn pf-btn--primary pf-btn--block">
            Update saved roadmap
          </button>
          <button onClick={onSaveNew} className="pf-btn pf-btn--secondary pf-btn--block">
            Save as new copy
          </button>
          <button onClick={onCancel} className="pf-btn pf-btn--ghost pf-btn--block">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
