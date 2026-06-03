import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { buildFlowElements } from "../lib/layout";
import { useRoadmapStore } from "../store/roadmapStore";
import { PrimaryNode } from "./nodes/PrimaryNode";
import { SecondaryNode } from "./nodes/SecondaryNode";
import { SectionHeaderNode } from "./nodes/SectionHeaderNode";

// Defined at module scope so React Flow doesn't see a new object each render.
const nodeTypes: NodeTypes = {
  primary: PrimaryNode,
  secondary: SecondaryNode,
  section_header: SectionHeaderNode,
};

export function RoadmapCanvas() {
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const positions = useRoadmapStore((s) => s.positions);
  const branchingNodeId = useRoadmapStore((s) => s.branchingNodeId);
  const selectNode = useRoadmapStore((s) => s.selectNode);

  // No Dagre here — positions come from the store. Rebuilds on structure
  // changes (add/delete/type); node content is read live by node components.
  const elements = useMemo(
    () =>
      roadmap
        ? buildFlowElements(roadmap, positions, branchingNodeId)
        : { nodes: [], edges: [] },
    [roadmap, positions, branchingNodeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(elements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(elements.edges);

  useEffect(() => {
    setNodes(elements.nodes);
    setEdges(elements.edges);
  }, [elements, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = (_, node) => selectNode(node.id);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={() => selectNode(null)}
      // Phase 1 is view + inline edit only — no repositioning or edge drawing.
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      // Scroll wheel pans (like a webpage) instead of zooming; zoom is via the
      // +/- controls or pinch on touch devices. Drag still pans the canvas.
      panOnScroll
      zoomOnScroll={false}
      minZoom={0.4}
      maxZoom={1.5}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
