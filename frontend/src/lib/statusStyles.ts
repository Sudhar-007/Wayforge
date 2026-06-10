import type { NodeStatus } from "../types/roadmap";

/** Human-readable status labels for the panel dropdown and tooltips. */
export const STATUS_LABELS: Record<NodeStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
};

/** Glyph shown on the inline status toggle for each status. */
export const STATUS_GLYPHS: Record<NodeStatus, string> = {
  not_started: "○",
  in_progress: "◐",
  completed: "✓",
  skipped: "–",
};

/**
 * Background tint applied to a node by status. Full literal class strings (no
 * interpolation) so Tailwind's content scanner emits them. Maps onto the Wayforge
 * `status-*` design tokens (see src/export/DESIGN-TOKENS.md).
 */
export const STATUS_NODE_TINT: Record<NodeStatus, string> = {
  not_started: "bg-node-surface",
  in_progress: "bg-status-in-progress/10",
  completed: "bg-status-completed/10",
  skipped: "bg-status-skipped/[0.07]",
};

/**
 * Outline COLOR by status, as a Tailwind `ring-*` (ring) color. Solid nodes draw
 * their outline as an inset box-shadow ring rather than a CSS `border`: a 1px
 * border snaps unevenly under React Flow's fractional viewport zoom (edges thin
 * out / vanish, rounded corners split), whereas a box-shadow ring rasterizes at a
 * uniform thickness at any scale.
 */
export const STATUS_RING_COLOR: Record<NodeStatus, string> = {
  not_started: "ring-node-border",
  in_progress: "ring-status-in-progress",
  completed: "ring-status-completed",
  skipped: "ring-status-skipped/60",
};

/**
 * Outline COLOR by status, as a Tailwind `border-*` color. Used only by the
 * dashed "optional" (secondary) node, whose dashed style can't be expressed as a
 * box-shadow ring and so stays a real border.
 */
export const STATUS_BORDER_COLOR: Record<NodeStatus, string> = {
  not_started: "border-node-border",
  in_progress: "border-status-in-progress",
  completed: "border-status-completed",
  skipped: "border-status-skipped/60",
};

/** Status accent color, used for the toggle glyph and panel dots. */
export const STATUS_TEXT_CLASSES: Record<NodeStatus, string> = {
  not_started: "text-status-not-started",
  in_progress: "text-status-in-progress",
  completed: "text-status-completed",
  skipped: "text-status-skipped",
};
