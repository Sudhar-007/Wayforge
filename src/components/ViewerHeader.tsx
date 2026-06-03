import { useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { Legend } from "./Legend";
import { SaveChoiceModal } from "./SaveChoiceModal";

/** Shared base styling for a header button — keeps the buttons consistent. */
const BTN_BASE =
  "mt-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

/** Derived save-button presentation from the (savedRoadmapId, isDirty, saveStatus)
 * triple. `saveStatus` only carries the transient saving/error states; the rest
 * of the button's meaning comes from whether the roadmap is saved and dirty. */
function saveButton(
  saved: boolean,
  dirty: boolean,
  status: "idle" | "saving" | "error",
): { label: string; style: string; disabled: boolean } {
  if (status === "saving") {
    return {
      label: "Saving…",
      style: "bg-indigo-600 text-white opacity-70 cursor-not-allowed",
      disabled: true,
    };
  }
  if (status === "error") {
    return {
      label: "Save failed — retry",
      style: "bg-red-600 text-white hover:bg-red-700",
      disabled: false,
    };
  }
  if (!saved) {
    return {
      label: "Save Roadmap",
      style: "bg-indigo-600 text-white hover:bg-indigo-700",
      disabled: false,
    };
  }
  if (dirty) {
    return {
      label: "Save changes",
      style: "bg-indigo-600 text-white hover:bg-indigo-700",
      disabled: false,
    };
  }
  return {
    label: "Saved ✓",
    style: "bg-emerald-600 text-white cursor-default",
    disabled: true,
  };
}

/** Styled header above the roadmap viewer: editable title, save flow, legend. */
export function ViewerHeader() {
  const setView = useRoadmapStore((s) => s.setView);
  const topic = useRoadmapStore((s) => s.form.topic);
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const user = useRoadmapStore((s) => s.user);
  const saveStatus = useRoadmapStore((s) => s.saveStatus);
  const savedRoadmapId = useRoadmapStore((s) => s.savedRoadmapId);
  const isDirty = useRoadmapStore((s) => s.isDirty);
  const saveRoadmapToAccount = useRoadmapStore((s) => s.saveRoadmapToAccount);
  const updateSavedRoadmap = useRoadmapStore((s) => s.updateSavedRoadmap);
  const renameRoadmapTitle = useRoadmapStore((s) => s.renameRoadmapTitle);

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const title = roadmap?.title || "Your Learning Roadmap";
  const btn = saveButton(savedRoadmapId !== null, isDirty, saveStatus);

  const onSaveClick = () => {
    // Already-saved + dirty → ask whether to overwrite or fork. Otherwise just
    // create the first row (or retry after an error).
    if (savedRoadmapId !== null && isDirty) {
      setShowSavePrompt(true);
    } else {
      void saveRoadmapToAccount();
    }
  };

  const startEditing = () => {
    setTitleDraft(title);
    setEditingTitle(true);
  };

  const commitTitle = () => {
    setEditingTitle(false);
    void renameRoadmapTitle(titleDraft);
  };

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 pl-16 pr-6 pt-8">
      <div className="flex items-start gap-4">
        <button
          onClick={() => setView("intake")}
          className="mt-1 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          ← New Roadmap
        </button>
        <div>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="w-full max-w-md rounded-md border border-slate-300 px-2 py-1 text-2xl font-semibold tracking-tight text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Roadmap title"
            />
          ) : (
            <button
              onClick={startEditing}
              title="Rename roadmap"
              className="group inline-flex items-center gap-2 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              <PencilIcon className="text-slate-400 opacity-0 transition group-hover:opacity-100" />
            </button>
          )}
          <p className="mt-1 text-sm text-slate-600">{topic || "Your topic"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={onSaveClick}
            disabled={btn.disabled}
            className={`${BTN_BASE} ${btn.style}`}
          >
            {btn.label}
          </button>
        ) : (
          <button
            onClick={() => setView("login")}
            className={`${BTN_BASE} border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50`}
          >
            Sign in to save
          </button>
        )}
        <Legend />
      </div>

      {showSavePrompt && (
        <SaveChoiceModal
          onUpdate={() => {
            setShowSavePrompt(false);
            void updateSavedRoadmap();
          }}
          onSaveNew={() => {
            setShowSavePrompt(false);
            void saveRoadmapToAccount();
          }}
          onCancel={() => setShowSavePrompt(false)}
        />
      )}
    </header>
  );
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
