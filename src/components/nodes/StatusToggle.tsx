import { useRoadmapStore } from "../../store/roadmapStore";
import {
  STATUS_GLYPHS,
  STATUS_LABELS,
  STATUS_TEXT_CLASSES,
} from "../../lib/statusStyles";
import type { NodeStatus } from "../../types/roadmap";

interface StatusToggleProps {
  nodeId: string;
  status: NodeStatus;
}

/**
 * Inline status control on a node. Clicking cycles the status without opening
 * the detail panel — `stopPropagation` keeps the click from bubbling to React
 * Flow's node-click handler.
 */
export function StatusToggle({ nodeId, status }: StatusToggleProps) {
  const cycleStatus = useRoadmapStore((s) => s.cycleStatus);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        cycleStatus(nodeId);
      }}
      title={`${STATUS_LABELS[status]} — click to change`}
      aria-label={`Status: ${STATUS_LABELS[status]}. Click to change.`}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs leading-none ${STATUS_TEXT_CLASSES[status]}`}
    >
      {STATUS_GLYPHS[status]}
    </button>
  );
}
