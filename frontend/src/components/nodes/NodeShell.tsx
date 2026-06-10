import { Handle, Position } from "@xyflow/react";
import type { RoadmapNode } from "../../types/roadmap";
import { NODE_SIZES } from "../../lib/layout";
import {
  STATUS_NODE_TINT,
  STATUS_RING_COLOR,
  STATUS_BORDER_COLOR,
} from "../../lib/statusStyles";
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
  /** Apply status-driven outline/background tint (default true). Section
   * headers opt out so their dark surface stays constant. */
  applyStatusColors?: boolean;
  /**
   * How the node's outline is drawn:
   *  - `"solid"` (default) — an inset box-shadow ring in the status color. Renders
   *    at a uniform thickness under React Flow's fractional zoom (a CSS `border`
   *    snaps unevenly there).
   *  - `"dashed"` — a real dashed CSS border (the optional/secondary node; dashes
   *    can't be done with a box-shadow ring).
   *  - `"none"` — no status outline (the section header supplies its own surface).
   */
  outline?: "solid" | "dashed" | "none";
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
  outline = "solid",
}: NodeShellProps) {
  const size = NODE_SIZES[node.type];
  const branchingNodeId = useRoadmapStore((s) => s.branchingNodeId);
  const openBranchCreator = useRoadmapStore((s) => s.openBranchCreator);
  // Leaf nodes hide the bottom anchor dot (nothing connects below). The handle
  // stays mounted, just invisible, so React Flow can still attach a new edge
  // the moment a branch is created.
  const hasChildren = useRoadmapStore(
    (s) => s.roadmap?.edges.some((e) => e.source === node.id) ?? false,
  );

  const isBranching = branchingNodeId === node.id;
  // Hide every "+" while any branch popover is open ("edit mode").
  const showBranchButton = branchingNodeId === null;

  return (
    <div
      style={{ width: size.width, height: size.height }}
      className={[
        "group relative flex items-center justify-center rounded-md px-3",
        "cursor-pointer shadow-sm transition-shadow hover:shadow-md",
        node.status === "skipped" && applyStatusColors ? "opacity-[0.78]" : "",
        applyStatusColors ? STATUS_NODE_TINT[node.status] : "",
        // Outline: a uniform inset ring for solid nodes (even thickness at any
        // zoom), a real dashed border for the optional node, none for sections.
        applyStatusColors && outline === "solid"
          ? `ring-[1.5px] ring-inset ${STATUS_RING_COLOR[node.status]}`
          : "",
        applyStatusColors && outline === "dashed"
          ? `border-[1.5px] border-dashed ${STATUS_BORDER_COLOR[node.status]}`
          : "",
        containerClassName,
        // Selection uses `outline` (not a ring) so it never collides with the
        // status ring's box-shadow.
        isSelected
          ? "outline outline-2 outline-offset-2 outline-accent"
          : "",
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
        className={`!h-1.5 !w-1.5 !border-0 !bg-border-strong ${
          hasChildren ? "" : "!opacity-0"
        }`}
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
