import { useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { STATUS_LABELS } from "../lib/statusStyles";
import type { NodeStatus, NodeType, ResourceType } from "../types/roadmap";
import { AutoGrowTextarea } from "./AutoGrowTextarea";

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
 * Zustand store (optimistic); persistence is handled by the debounced autosave
 * in App. Phase 1: edit title, description, status, and add/remove resources.
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
    <aside className="flex h-full w-[360px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-node-border bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Edit node
        </span>
        <button
          type="button"
          onClick={() => selectNode(null)}
          aria-label="Close panel"
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      {/* Type */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Type</span>
        <select
          value={node.type}
          onChange={(e) =>
            updateNode(node.id, { type: e.target.value as NodeType })
          }
          className="rounded-md border border-node-border px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Title — auto-grows to 2 lines then scrolls; stays one string in state. */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Title</span>
        <AutoGrowTextarea
          value={node.title}
          onChange={(e) => updateNode(node.id, { title: e.target.value })}
          className="block w-full rounded-md border border-node-border px-3 py-2 text-sm leading-5 focus:border-slate-400 focus:outline-none"
        />
      </label>

      {/* Status */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Status</span>
        <select
          value={node.status}
          onChange={(e) =>
            updateNode(node.id, { status: e.target.value as NodeStatus })
          }
          className="rounded-md border border-node-border px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      {/* Description (Markdown source, edited as plain text) */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">
          Description (Markdown)
        </span>
        <textarea
          value={node.description}
          onChange={(e) => updateNode(node.id, { description: e.target.value })}
          rows={6}
          className="resize-y rounded-md border border-node-border px-3 py-2 text-sm leading-relaxed focus:border-slate-400 focus:outline-none"
        />
      </label>

      {/* Resources */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-500">Resources</span>

        {node.resources.length === 0 && (
          <p className="text-xs text-slate-400">No resources yet.</p>
        )}

        <ul className="flex flex-col gap-2">
          {node.resources.map((resource, index) => (
            <li
              key={`${resource.url}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-node-border px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-slate-700 hover:underline"
                >
                  {resource.label}
                </a>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {resource.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeResource(node.id, index)}
                aria-label={`Remove ${resource.label}`}
                className="shrink-0 text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* Add-resource form */}
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-node-border p-3">
          <input
            type="text"
            placeholder="Label"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="rounded-md border border-node-border px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
          />
          <input
            type="url"
            placeholder="https://…"
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            className="rounded-md border border-node-border px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as ResourceType })
              }
              className="flex-1 rounded-md border border-node-border px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
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
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Delete (destructive) */}
      <button
        type="button"
        onClick={handleDelete}
        className="mt-auto rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete node
      </button>
    </aside>
  );
}
