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
 * Border + background tint applied to a node by status. Full literal class
 * strings (no interpolation) so Tailwind's content scanner emits them. Maps onto
 * the Wayforge `status-*` design tokens (see src/export/DESIGN-TOKENS.md).
 */
export const STATUS_NODE_CLASSES: Record<NodeStatus, string> = {
  not_started: "border-node-border bg-node-surface",
  in_progress: "border-status-in-progress bg-status-in-progress/10",
  completed: "border-status-completed bg-status-completed/10",
  skipped: "border-status-skipped/60 bg-status-skipped/[0.07]",
};

/** Status accent color, used for the toggle glyph and panel dots. */
export const STATUS_TEXT_CLASSES: Record<NodeStatus, string> = {
  not_started: "text-status-not-started",
  in_progress: "text-status-in-progress",
  completed: "text-status-completed",
  skipped: "text-status-skipped",
};
