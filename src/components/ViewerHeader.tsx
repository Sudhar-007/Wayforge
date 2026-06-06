import { useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { Legend } from "./Legend";
import { SaveChoiceModal } from "./SaveChoiceModal";
import { ThemeToggle } from "./ThemeToggle";
import { AppMenu } from "./AppMenu";
import { Icon } from "./icons";

/** Derived save-button presentation from the (savedRoadmapId, isDirty, saveStatus)
 * triple. `saveStatus` only carries the transient saving/error states; the rest
 * of the button's meaning comes from whether the roadmap is saved and dirty. */
function saveButton(
  saved: boolean,
  dirty: boolean,
  status: "idle" | "saving" | "error",
): { label: string; className: string; disabled: boolean; showCheck: boolean } {
  if (status === "saving") {
    return {
      label: "Saving…",
      className: "pf-btn pf-btn--primary opacity-75 cursor-not-allowed",
      disabled: true,
      showCheck: false,
    };
  }
  if (status === "error") {
    return {
      label: "Save failed — retry",
      className: "pf-btn pf-btn--danger",
      disabled: false,
      showCheck: false,
    };
  }
  if (!saved) {
    return {
      label: "Save roadmap",
      className: "pf-btn pf-btn--primary",
      disabled: false,
      showCheck: false,
    };
  }
  if (dirty) {
    return {
      label: "Save changes",
      className: "pf-btn pf-btn--primary",
      disabled: false,
      showCheck: false,
    };
  }
  return {
    label: "Saved",
    className: "pf-btn pf-btn--secondary cursor-default",
    disabled: true,
    showCheck: true,
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
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg px-6 py-3.5">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={() => setView("home")}
          className="pf-btn pf-btn--secondary pf-btn--sm shrink-0"
          style={{ height: 38 }}
        >
          <Icon.plus /> New roadmap
        </button>
        <div className="min-w-0">
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
              className="pf-input max-w-md font-display text-h3 font-bold"
              style={{ padding: "4px 10px" }}
              aria-label="Roadmap title"
            />
          ) : (
            <button
              onClick={startEditing}
              title="Rename roadmap"
              className="group flex items-center gap-2 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <h1 className="truncate font-display text-h3 font-bold tracking-tight text-text">
                {title}
              </h1>
              <span className="text-text-4 opacity-0 transition group-hover:opacity-100">
                <Icon.pencil />
              </span>
            </button>
          )}
          <p className="mt-0.5 truncate text-sm text-text-3">
            {topic || "Manual roadmap"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {user ? (
          <button
            onClick={onSaveClick}
            disabled={btn.disabled}
            className={btn.className}
            style={{ height: 38 }}
          >
            {btn.showCheck && <Icon.check />}
            {btn.label}
          </button>
        ) : (
          <button
            onClick={() => setView("login")}
            className="pf-btn pf-btn--secondary pf-btn--sm"
            style={{ height: 38 }}
          >
            Sign in to save
          </button>
        )}
        <Legend />
        <ThemeToggle size={38} />
        <AppMenu />
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
