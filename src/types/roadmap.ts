/**
 * Type definitions for a Pathfinder learning roadmap.
 *
 * A roadmap is rendered as a directed acyclic graph (DAG): `nodes` are the
 * topics/sections and `edges` describe the prerequisite relationships between
 * them. These types mirror the schema used in `mock-roadmap.json`.
 */

/** Visual/semantic role a node plays in the roadmap. */
export type NodeType = "primary" | "secondary" | "section_header";

/** Learner progress for a given node. */
export type NodeStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

/** Kind of learning resource attached to a node. */
export type ResourceType = "article" | "video" | "course" | "docs";

/** Whether traversing an edge is mandatory or merely suggested. */
export type EdgeType = "required" | "optional";

/** An external learning resource linked from a node. */
export interface RoadmapResource {
  label: string;
  url: string;
  type: ResourceType;
}

/** A single topic, section header, or optional side-quest in the roadmap. */
export interface RoadmapNode {
  /** UUID identifying the node. */
  id: string;
  title: string;
  /** Description; may contain Markdown. */
  description: string;
  type: NodeType;
  status: NodeStatus;
  resources: RoadmapResource[];
}

/** A directed prerequisite link between two nodes. */
export interface RoadmapEdge {
  id: string;
  /** `id` of the source node. */
  source: string;
  /** `id` of the target node. */
  target: string;
  type: EdgeType;
}

/** The full editable roadmap document. */
export interface Roadmap {
  id: string;
  title: string;
  description: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}
