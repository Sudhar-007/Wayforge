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
      className="nodrag nopan absolute left-1/2 top-full z-50 mt-2 flex w-56 -translate-x-1/2 flex-col gap-3 rounded-lg border border-node-border bg-white p-3 text-left text-slate-800 shadow-lg"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <AutoGrowTextarea
        autoFocus
        value={title}
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
        onEnter={submit}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeBranchCreator();
        }}
        className="block w-full rounded-md border border-node-border px-2 py-1.5 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
      />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-medium text-slate-500">Type</legend>
        {NODE_TYPES.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="branch-type"
              checked={type === opt.value}
              onChange={() => setType(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-medium text-slate-500">Edge</legend>
        {EDGE_TYPES.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="branch-edge"
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
          className="flex-1 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={closeBranchCreator}
          className="flex-1 rounded-md border border-node-border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
