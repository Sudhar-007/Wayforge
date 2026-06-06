import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipPos {
  left: number;
  top: number;
  placement: "above" | "below";
}

/** Gap (px) between the node title and the tooltip. */
const GAP = 8;
/** If the title's top is within this many px of the viewport top, flip below. */
const FLIP_THRESHOLD = 96;

/**
 * The node title text. It truncates with an ellipsis at the node's fixed width
 * (unchanged), and shows a hover/focus tooltip with the FULL title — but only
 * when the text is actually truncated.
 *
 * The tooltip renders through a portal on `document.body` with fixed
 * positioning: React Flow's viewport applies a zoom transform and the pane
 * clips overflow, so an in-node absolute tooltip would be scaled and could be
 * cut off. A body portal keeps it crisp and above everything.
 */
export function NodeTitle({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<TooltipPos | null>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    // Only when the rendered width is smaller than the natural text width.
    if (el.scrollWidth <= el.clientWidth) return;

    const rect = el.getBoundingClientRect();
    const nearTop = rect.top < FLIP_THRESHOLD;
    setPos({
      left: rect.left + rect.width / 2,
      top: nearTop ? rect.bottom + GAP : rect.top - GAP,
      placement: nearTop ? "below" : "above",
    });
  };

  const hide = () => setPos(null);

  return (
    <>
      <span
        ref={ref}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={`w-full truncate text-center outline-none ${className ?? ""}`}
      >
        {title}
      </span>

      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform:
                pos.placement === "above"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
            }}
            className="pointer-events-none z-50 max-w-[320px] break-words rounded-md bg-text px-2.5 py-1.5 text-xs font-medium text-bg shadow-lg"
          >
            {title}
            <span
              aria-hidden
              className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-text"
              style={pos.placement === "above" ? { bottom: -3 } : { top: -3 }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
