import { STATUS_LABELS, STATUS_TEXT_CLASSES } from "../lib/statusStyles";
import type { NodeStatus } from "../types/roadmap";

const STATUSES = Object.keys(STATUS_LABELS) as NodeStatus[];

/** Compact key for status colors and node/edge conventions. */
export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
      {STATUSES.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full bg-current ${STATUS_TEXT_CLASSES[status]}`}
          />
          {STATUS_LABELS[status]}
        </span>
      ))}
      <span className="text-slate-300">|</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-2 border-edge-required" />
        Required
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-2 border-dashed border-edge-optional" />
        Optional
      </span>
    </div>
  );
}
