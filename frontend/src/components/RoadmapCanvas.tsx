import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
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
import { Icon } from "./icons";

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

  // Guided empty-editor state — shown for a brand-new (manual) roadmap with no
  // nodes yet, in place of the canvas.
  if (roadmap && roadmap.nodes.length === 0) {
    return <EmptyEditor />;
  }

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
      style={{ background: "var(--bg)" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="var(--canvas-dot)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/** Empty-canvas guidance for a fresh manual roadmap. */
function EmptyEditor() {
  const addRootNode = useRoadmapStore((s) => s.addRootNode);

  return (
    <div className="flex h-full items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <p className="t-eyebrow">Blank canvas</p>
        <h2 className="mt-3 font-display text-h2 font-bold tracking-tight text-text">
          Build your roadmap
        </h2>
        <p className="mt-2.5 text-base text-text-2">
          Add your first node, then connect and branch from it to shape your
          path.
        </p>
        <button
          onClick={addRootNode}
          className="pf-btn pf-btn--primary pf-btn--lg mt-7"
        >
          <Icon.plus /> Add your first node
        </button>
        <div className="mt-10 flex flex-col divide-y divide-border border-t border-border">
          <Hint n="01" title="Add nodes" body="Topics, sections, and optional side-quests." />
          <Hint n="02" title="Branch & connect" body="Hover a node and press + to branch." />
          <Hint n="03" title="Track status" body="Mark steps as you progress." />
        </div>
      </div>
    </div>
  );
}

function Hint({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex items-baseline gap-4 py-3">
      <span className="font-mono text-xs text-text-4">{n}</span>
      <span className="text-sm font-medium text-text">{title}</span>
      <span className="ml-auto text-right text-xs text-text-3">{body}</span>
    </div>
  );
}
