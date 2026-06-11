import { useEffect, type ReactNode } from "react";

/**
 * Confirmation modal for destructive actions (node delete, saved-roadmap
 * delete). Same shell as SaveChoiceModal so dialogs stay visually consistent.
 * Closes on backdrop click, Escape, or Cancel.
 */
export function ConfirmDeleteModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
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
        aria-labelledby="confirm-delete-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <h2
          id="confirm-delete-title"
          className="font-display text-h3 font-bold text-text"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-text-2">{body}</p>

        <div className="mt-6 space-y-2.5">
          <button onClick={onConfirm} className="pf-btn pf-btn--danger pf-btn--block">
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="pf-btn pf-btn--ghost pf-btn--block">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
