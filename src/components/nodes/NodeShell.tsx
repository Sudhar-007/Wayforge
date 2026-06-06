import { Handle, Position } from "@xyflow/react";
import type { RoadmapNode } from "../../types/roadmap";
import { NODE_SIZES } from "../../lib/layout";
import { STATUS_NODE_CLASSES } from "../../lib/statusStyles";
import { useRoadmapStore } from "../../store/roadmapStore";
import { StatusToggle } from "./StatusToggle";
import { BranchCreatorPopover } from "./BranchCreatorPopover";
import { NodeTitle } from "./NodeTitle";
import { Icon } from "../icons";

interface NodeShellProps {
  node: RoadmapNode;
  isSelected: boolean;
  /** Type-specific base classes (shape, border style, surface, text). */
  containerClassName: string;
  /** Title typography classes. */
  titleClassName: string;
  /** Whether to render the inline status toggle (default true). */
  showToggle?: boolean;
  /** Apply status-driven border/background tint (default true). Section
   * headers opt out so their dark surface stays constant. */
  applyStatusColors?: boolean;
}

/**
 * Shared chrome for every roadmap node: fixed sizing (matching the Dagre
 * layout), top/bottom connection handles, the title, an optional inline status
 * toggle, status-driven coloring, a selection ring, and the hover "+" control
 * that opens an inline branch-creator popover. Per-type look is passed in via
 * class props by the concrete node components.
 */
export function NodeShell({
  node,
  isSelected,
  containerClassName,
  titleClassName,
  showToggle = true,
  applyStatusColors = true,
}: NodeShellProps) {
  const size = NODE_SIZES[node.type];
  const branchingNodeId = useRoadmapStore((s) => s.branchingNodeId);
  const openBranchCreator = useRoadmapStore((s) => s.openBranchCreator);

  const isBranching = branchingNodeId === node.id;
  // Hide every "+" while any branch popover is open ("edit mode").
  const showBranchButton = branchingNodeId === null;

  return (
    <div
      style={{ width: size.width, height: size.height }}
      className={[
        "group relative flex items-center justify-center rounded-lg px-3",
        "cursor-pointer shadow-sm transition-shadow hover:shadow-md",
        node.status === "skipped" && applyStatusColors ? "opacity-[0.78]" : "",
        applyStatusColors ? STATUS_NODE_CLASSES[node.status] : "",
        containerClassName,
        isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "",
      ].join(" ")}
    >
      {/* Incoming-edge anchor (top) and outgoing-edge anchor (bottom). Dragging
          to connect is disabled at the ReactFlow level. */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
      />

      {/* Title fills the full fixed width and truncates on a single line; the
          status toggle is absolutely positioned so it never reduces this width.
          NodeTitle adds a hover/focus tooltip with the full text when truncated. */}
      <NodeTitle title={node.title} className={titleClassName} />

      {showToggle && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          <StatusToggle nodeId={node.id} status={node.status} />
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
      />

      {/* Branch creator: "+" at the bottom-right corner, away from the status
          toggle, shown on hover. stopPropagation so it doesn't open the panel. */}
      {showBranchButton && (
        <button
          type="button"
          aria-label="Add branch"
          title="Add a branch from this node"
          onClick={(e) => {
            e.stopPropagation();
            openBranchCreator(node.id);
          }}
          className="nodrag nopan absolute -bottom-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs leading-none text-accent-on opacity-0 shadow transition-opacity hover:bg-accent-hover group-hover:opacity-100"
        >
          <Icon.plus width={12} height={12} />
        </button>
      )}

      {isBranching && <BranchCreatorPopover parentId={node.id} />}
    </div>
  );
}
