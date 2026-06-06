import { useRoadmapStore } from "../../store/roadmapStore";
import { STATUS_LABELS, STATUS_TEXT_CLASSES } from "../../lib/statusStyles";
import type { NodeStatus } from "../../types/roadmap";
import { Icon } from "../icons";

interface StatusToggleProps {
  nodeId: string;
  status: NodeStatus;
}

/** Whether a status renders as a solid dot (vs. a hollow ring). */
const FILLED: Record<NodeStatus, boolean> = {
  not_started: false,
  in_progress: true,
  completed: true,
  skipped: false,
};

/** Small status indicator: a hollow ring, a filled dot, or a check (completed). */
export function StatusDot({ status, size = 9 }: { status: NodeStatus; size?: number }) {
  const filled = FILLED[status];
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${STATUS_TEXT_CLASSES[status]}`}
      style={{
        width: size,
        height: size,
        background: filled ? "currentColor" : "transparent",
        boxShadow: filled ? "none" : "inset 0 0 0 2px currentColor",
      }}
    />
  );
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
      className="nodrag flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition hover:bg-surface-3"
    >
      {status === "completed" ? (
        <span className={STATUS_TEXT_CLASSES.completed}>
          <Icon.check width={12} height={12} />
        </span>
      ) : (
        <StatusDot status={status} size={11} />
      )}
    </button>
  );
}
