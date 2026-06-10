import { useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { STATUS_LABELS } from "../lib/statusStyles";
import type { NodeStatus, NodeType, ResourceType } from "../types/roadmap";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import { StatusDot } from "./nodes/StatusToggle";
import { Icon } from "./icons";

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as NodeStatus[];
const RESOURCE_TYPES: ResourceType[] = ["article", "video", "course", "docs"];

const TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: "section_header", label: "Section header" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const EMPTY_RESOURCE = { label: "", url: "", type: "article" as ResourceType };

/**
 * Right-side editor for the selected node. All edits write straight to the
 * Zustand store (optimistic). Restyled to the Wayforge spec; logic unchanged.
 */
export function DetailPanel() {
  const node = useRoadmapStore((s) =>
    s.roadmap?.nodes.find((n) => n.id === s.selectedNodeId),
  );
  const selectNode = useRoadmapStore((s) => s.selectNode);
  const updateNode = useRoadmapStore((s) => s.updateNode);
  const addResource = useRoadmapStore((s) => s.addResource);
  const removeResource = useRoadmapStore((s) => s.removeResource);
  const deleteNode = useRoadmapStore((s) => s.deleteNode);

  const [draft, setDraft] = useState(EMPTY_RESOURCE);

  if (!node) return null;

  const handleAddResource = () => {
    if (!draft.label.trim() || !draft.url.trim()) return;
    addResource(node.id, draft);
    setDraft(EMPTY_RESOURCE);
  };

  const handleDelete = () => {
    if (window.confirm("Delete this node and its connections?")) {
      deleteNode(node.id);
    }
  };

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="t-eyebrow">Edit node</span>
        <button
          type="button"
          onClick={() => selectNode(null)}
          aria-label="Close panel"
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-3 transition hover:bg-surface-2 hover:text-text"
        >
          <Icon.close />
        </button>
      </div>

      {/* Type */}
      <label className="flex flex-col gap-2">
        <span className="pf-label" style={{ margin: 0 }}>
          Type
        </span>
        <select
          className="pf-select"
          value={node.type}
          onChange={(e) =>
            updateNode(node.id, { type: e.target.value as NodeType })
          }
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Title — auto-grows to 2 lines then scrolls; stays one string in state. */}
      <label className="flex flex-col gap-2">
        <span className="pf-label" style={{ margin: 0 }}>
          Title
        </span>
        <AutoGrowTextarea
          className="pf-textarea block w-full leading-5"
          value={node.title}
          onChange={(e) => updateNode(node.id, { title: e.target.value })}
        />
      </label>

      {/* Status — segmented 2×2 grid */}
      <div className="flex flex-col gap-2">
        <span className="pf-label" style={{ margin: 0 }}>
          Status
        </span>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              type="button"
              key={status}
              className="pf-seg-item"
              data-active={node.status === status}
              style={{ gap: 7, fontSize: 12.5, padding: "9px 8px" }}
              onClick={() => updateNode(node.id, { status })}
            >
              <StatusDot status={status} /> {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Description (Markdown source, edited as plain text) */}
      <label className="flex flex-col gap-2">
        <span className="pf-label" style={{ margin: 0 }}>
          Description
        </span>
        <textarea
          className="pf-textarea"
          value={node.description}
          onChange={(e) => updateNode(node.id, { description: e.target.value })}
          rows={5}
          style={{ resize: "vertical" }}
          placeholder="Add a description (Markdown supported)…"
        />
      </label>

      {/* Resources */}
      <div className="flex flex-col gap-2">
        <span className="pf-label" style={{ margin: 0 }}>
          Resources
        </span>

        {node.resources.length === 0 && (
          <p className="text-xs text-text-3">No resources yet.</p>
        )}

        <ul className="flex flex-col gap-2">
          {node.resources.map((resource, index) => (
            <li
              key={`${resource.url}-${index}`}
              className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2"
            >
              <span className="shrink-0 rounded-pill border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-3">
                {resource.type}
              </span>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-text-2 hover:text-accent hover:underline"
              >
                {resource.label}
              </a>
              <button
                type="button"
                onClick={() => removeResource(node.id, index)}
                aria-label={`Remove ${resource.label}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-3 transition hover:bg-surface-3 hover:text-danger"
              >
                <Icon.close />
              </button>
            </li>
          ))}
        </ul>

        {/* Add-resource form */}
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <input
            type="text"
            className="pf-input"
            style={{ padding: "8px 10px", fontSize: 13 }}
            placeholder="Label"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <input
            type="url"
            className="pf-input"
            style={{ padding: "8px 10px", fontSize: 13 }}
            placeholder="https://…"
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              className="pf-select flex-1"
              style={{ padding: "8px 10px", fontSize: 13 }}
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as ResourceType })
              }
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddResource}
              disabled={!draft.label.trim() || !draft.url.trim()}
              className="pf-btn pf-btn--secondary pf-btn--sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon.plus /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Delete (destructive) */}
      <button
        type="button"
        onClick={handleDelete}
        className="pf-btn pf-btn--danger pf-btn--block mt-auto"
      >
        <Icon.trash /> Delete node
      </button>
    </aside>
  );
}
