import type { NodeProps } from "@xyflow/react";
import type { RoadmapFlowNode } from "../../lib/layout";
import { useRoadmapStore } from "../../store/roadmapStore";
import { NodeShell } from "./NodeShell";

/** Required topic — solid rounded rectangle. */
export function PrimaryNode({ data }: NodeProps<RoadmapFlowNode>) {
  const node = useRoadmapStore((s) =>
    s.roadmap?.nodes.find((n) => n.id === data.nodeId),
  );
  const isSelected = useRoadmapStore((s) => s.selectedNodeId === data.nodeId);

  if (!node) return null;

  return (
    <NodeShell
      node={node}
      isSelected={isSelected}
      containerClassName="border text-text text-sm font-medium"
      titleClassName="text-center"
    />
  );
}
