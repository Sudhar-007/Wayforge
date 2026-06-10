import { useEffect, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { Icon } from "./icons";

/**
 * Manual-create dialog: the user names a roadmap, and we drop them onto a blank
 * canvas (the guided empty-editor state) to build it node by node. Closes on
 * backdrop click, Escape, or Cancel.
 */
export function CreateManualModal() {
  const closeModal = useRoadmapStore((s) => s.closeModal);
  const createManualRoadmap = useRoadmapStore((s) => s.createManualRoadmap);

  const [title, setTitle] = useState("");
  const canSubmit = title.trim().length > 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal]);

  const submit = () => {
    if (canSubmit) createManualRoadmap(title.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4"
      onMouseDown={closeModal}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-create-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-7 shadow-lg"
      >
        <p className="t-eyebrow">Build by hand</p>
        <h2
          id="manual-create-title"
          className="mt-3 font-display text-h3 font-bold text-text"
        >
          Name your roadmap
        </h2>
        <p className="mt-2 text-sm text-text-2">
          Give it a title to start — you&rsquo;ll build the nodes yourself on a
          blank canvas. You can rename it anytime.
        </p>

        <div className="mt-5">
          <label htmlFor="rm-title" className="pf-label">
            Roadmap title
          </label>
          <input
            id="rm-title"
            className="pf-input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. My Rust learning path"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button className="pf-btn pf-btn--ghost" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="pf-btn pf-btn--primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={submit}
          >
            Create roadmap <Icon.arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
