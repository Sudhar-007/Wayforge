import type { NodeProps } from "@xyflow/react";
import type { RoadmapFlowNode } from "../../lib/layout";
import { useRoadmapStore } from "../../store/roadmapStore";
import { NodeShell } from "./NodeShell";

/** Section divider — larger, bolder, dark surface. No inline status toggle. */
export function SectionHeaderNode({ data }: NodeProps<RoadmapFlowNode>) {
  const node = useRoadmapStore((s) =>
    s.roadmap?.nodes.find((n) => n.id === data.nodeId),
  );
  const isSelected = useRoadmapStore((s) => s.selectedNodeId === data.nodeId);

  if (!node) return null;

  return (
    <NodeShell
      node={node}
      isSelected={isSelected}
      applyStatusColors={false}
      showToggle={false}
      containerClassName="border border-section-surface bg-section-surface text-section-text font-display text-base font-semibold"
      titleClassName="text-center"
    />
  );
}
