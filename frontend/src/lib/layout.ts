import dagre from "@dagrejs/dagre";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { NodeType, Roadmap } from "../types/roadmap";

/** Data carried on each React Flow node. Components read the live node from the
 * store by id, so positions can stay in state while node content edits freely. */
export type RoadmapNodeData = { nodeId: string };

export type RoadmapFlowNode = Node<RoadmapNodeData>;

/** Top-left node positions, keyed by node id. Held in the store, not recomputed. */
export type NodePositions = Record<string, { x: number; y: number }>;

/**
 * Fixed render dimensions per node type. Shared between Dagre (so the computed
 * layout reserves the right space) and the node components (so what renders
 * matches what was laid out).
 */
export const NODE_SIZES: Record<NodeType, { width: number; height: number }> = {
  section_header: { width: 320, height: 64 },
  primary: { width: 240, height: 56 },
  secondary: { width: 220, height: 48 },
};

/**
 * Edge stroke colors. React Flow edges are SVG and take inline `style`, not
 * Tailwind classes, so we reference the `--edge-*` CSS variables directly — this
 * keeps the strokes in sync with the design tokens and theme-aware (they flip
 * under [data-theme="dark"]).
 */
const EDGE_COLORS = {
  required: "var(--edge-required)",
  optional: "var(--edge-optional)",
} as const;

const DAGRE_CONFIG = {
  rankdir: "TB",
  nodesep: 120, // horizontal gap between siblings
  ranksep: 140, // vertical gap between ranks
  marginx: 20,
  marginy: 20,
} as const;

/**
 * Run Dagre **once** on initial load to derive top-to-bottom node positions
 * from the DAG structure. After this the positions live in the store and are
 * never auto-recalculated — manual node creation/deletion places/removes single
 * entries without moving existing nodes.
 */
export function computeDagreLayout(roadmap: Roadmap): NodePositions {
  const g = new dagre.graphlib.Graph();
  g.setGraph(DAGRE_CONFIG);
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of roadmap.nodes) {
    const size = NODE_SIZES[node.type];
    g.setNode(node.id, { width: size.width, height: size.height });
  }
  for (const edge of roadmap.edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions: NodePositions = {};
  for (const node of roadmap.nodes) {
    const size = NODE_SIZES[node.type];
    const { x, y } = g.node(node.id);
    // Dagre returns node centers; React Flow positions are top-left.
    positions[node.id] = { x: x - size.width / 2, y: y - size.height / 2 };
  }
  return positions;
}

/**
 * Map the domain roadmap + stored positions into React Flow nodes/edges. No
 * layout work happens here — positions come straight from the store.
 *
 * `branchingNodeId` is raised above its neighbors so its branch-creator popover
 * isn't clipped by lower nodes.
 */
export function buildFlowElements(
  roadmap: Roadmap,
  positions: NodePositions,
  branchingNodeId: string | null,
): { nodes: RoadmapFlowNode[]; edges: Edge[] } {
  const nodes: RoadmapFlowNode[] = roadmap.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: { nodeId: node.id },
    ...(node.id === branchingNodeId ? { zIndex: 1000 } : {}),
  }));

  const edges: Edge[] = roadmap.edges.map((edge) => {
    const color = EDGE_COLORS[edge.type];
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      pathOptions: { borderRadius: 20 },
      style: {
        stroke: color,
        strokeWidth: 1.5,
        // Optional prerequisites render dashed; required render solid.
        ...(edge.type === "optional" ? { strokeDasharray: "6 4" } : {}),
      },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });

  return { nodes, edges };
}
