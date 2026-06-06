import { useState } from "react";
import { useRoadmapStore } from "../../store/roadmapStore";
import type { EdgeType, NodeType } from "../../types/roadmap";
import { AutoGrowTextarea } from "../AutoGrowTextarea";

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: "section_header", label: "Section" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const EDGE_TYPES: { value: EdgeType; label: string }[] = [
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
];

/**
 * Inline popover for branching off a node. Rendered inside the parent node and
 * positioned just below it. `nodrag`/`nopan` + stopPropagation keep React Flow
 * from panning or selecting the node while the form is in use.
 */
export function BranchCreatorPopover({ parentId }: { parentId: string }) {
  const addChildNode = useRoadmapStore((s) => s.addChildNode);
  const closeBranchCreator = useRoadmapStore((s) => s.closeBranchCreator);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<NodeType>("primary");
  const [edgeType, setEdgeType] = useState<EdgeType>("required");

  const submit = () => {
    if (!title.trim()) return;
    addChildNode(parentId, { title, type, edgeType });
  };

  return (
    <div
      className="nodrag nopan absolute left-1/2 top-full z-50 mt-2 flex w-60 -translate-x-1/2 flex-col gap-3 rounded-lg border border-border bg-surface p-3 text-left text-text shadow-lg"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <AutoGrowTextarea
        autoFocus
        value={title}
        placeholder="New topic title"
        onChange={(e) => setTitle(e.target.value)}
        onEnter={submit}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeBranchCreator();
        }}
        className="pf-input block w-full leading-5"
        style={{ padding: "8px 10px" }}
      />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-xs font-semibold text-text-3">Type</legend>
        {NODE_TYPES.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-text-2">
            <input
              type="radio"
              name="branch-type"
              className="accent-accent"
              checked={type === opt.value}
              onChange={() => setType(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-xs font-semibold text-text-3">Edge</legend>
        {EDGE_TYPES.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-text-2">
            <input
              type="radio"
              name="branch-edge"
              className="accent-accent"
              checked={edgeType === opt.value}
              onChange={() => setEdgeType(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim()}
          className="pf-btn pf-btn--primary pf-btn--sm flex-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={closeBranchCreator}
          className="pf-btn pf-btn--ghost pf-btn--sm flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
