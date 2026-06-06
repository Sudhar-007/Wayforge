import { useEffect, useRef, useState } from "react";
import { STATUS_LABELS } from "../lib/statusStyles";
import type { NodeStatus } from "../types/roadmap";
import { StatusDot } from "./nodes/StatusToggle";
import { Icon } from "./icons";

const STATUSES = Object.keys(STATUS_LABELS) as NodeStatus[];

/** Legend button that opens a popover key for status colors + edge conventions. */
export function Legend() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="pf-btn pf-btn--secondary pf-btn--sm"
        style={{ height: 38 }}
      >
        <Icon.grid /> Legend
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-4 shadow-lg">
          <div className="t-eyebrow mb-2.5">Status</div>
          <div className="flex flex-col gap-2">
            {STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-2.5">
                <StatusDot status={status} />
                <span className="text-sm text-text-2">{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
          <hr className="my-3 border-border" />
          <div className="t-eyebrow mb-2.5">Connections</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <svg width="26" height="8" aria-hidden>
                <line x1="0" y1="4" x2="26" y2="4" stroke="var(--edge-required)" strokeWidth="2" />
              </svg>
              <span className="text-sm text-text-2">Required</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg width="26" height="8" aria-hidden>
                <line x1="0" y1="4" x2="26" y2="4" stroke="var(--edge-optional)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
              <span className="text-sm text-text-2">Optional</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
