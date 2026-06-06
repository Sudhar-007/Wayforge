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
      <div className="flex max-w-lg flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface text-accent">
          <Icon.plus width={26} height={26} />
        </div>
        <h2 className="mt-5 font-display text-h2 font-bold tracking-tight text-text">
          Build your roadmap
        </h2>
        <p className="mt-2.5 max-w-md text-lg text-text-2">
          Your canvas is empty. Add your first node, then connect and branch from
          it to shape your path.
        </p>
        <button
          onClick={addRootNode}
          className="pf-btn pf-btn--primary pf-btn--lg mt-6"
        >
          <Icon.plus /> Add your first node
        </button>
        <div className="mt-10 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3">
          <Hint icon={<Icon.plus />} title="Add nodes" body="Topics, sections, and optional side-quests." />
          <Hint icon={<Icon.link />} title="Branch & connect" body="Hover a node and press + to branch." />
          <Hint icon={<Icon.check />} title="Track status" body="Mark steps as you progress." />
        </div>
      </div>
    </div>
  );
}

function Hint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-3.5">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <div className="text-sm font-semibold text-text">{title}</div>
        <div className="mt-0.5 text-xs text-text-3">{body}</div>
      </div>
    </div>
  );
}
