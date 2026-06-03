import { useLayoutEffect, useRef } from "react";

interface AutoGrowTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  value: string;
  /** How many lines the field may grow to before it scrolls instead. */
  maxLines?: number;
  /**
   * Called when Enter (without Shift) is pressed. A newline is NEVER inserted —
   * the title is one logical string, only visually wrapped. Pass a submit
   * handler here, or omit it to make Enter a no-op.
   */
  onEnter?: () => void;
}

/**
 * A single-line-styled <textarea> that auto-expands its height from 1 line up to
 * `maxLines`, then scrolls vertically inside the field. Used for title fields
 * that must wrap visually while staying a single string in state.
 *
 * The manual resize handle is disabled and Enter never inserts a newline.
 */
export function AutoGrowTextarea({
  value,
  maxLines = 2,
  onEnter,
  onKeyDown,
  style,
  ...rest
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Reset to auto, measure content, then cap at `maxLines`. Toggling overflow
  // keeps the scrollbar hidden until the content actually exceeds the cap.
  // box-sizing is border-box (Tailwind preflight), so border is added back in.
  const resize = (el: HTMLTextAreaElement) => {
    const cs = getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || 20;
    const borderY =
      (parseFloat(cs.borderTopWidth) || 0) +
      (parseFloat(cs.borderBottomWidth) || 0);
    const padY =
      (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const maxHeight = maxLines * lineHeight + padY + borderY;

    el.style.height = "auto";
    const contentHeight = el.scrollHeight + borderY;
    el.style.height = `${Math.min(contentHeight, maxHeight)}px`;
    el.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  };

  // Runs on mount and whenever the value changes (typing or an external update,
  // e.g. selecting a different node), before paint so there's no flicker.
  useLayoutEffect(() => {
    if (ref.current) resize(ref.current);
  }, [value, maxLines]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          // Never add a newline; trigger the optional submit on plain Enter.
          e.preventDefault();
          if (!e.shiftKey) onEnter?.();
        }
        onKeyDown?.(e);
      }}
      // Manual resize off; overflow is managed dynamically in resize().
      style={{ resize: "none", overflowY: "hidden", ...style }}
      {...rest}
    />
  );
}
