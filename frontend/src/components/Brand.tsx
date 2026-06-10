import { Icon } from "./icons";

/** Wayforge logo mark + wordmark. Clickable when an onClick is provided. */
export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="Wayforge home"
    >
      <span className="text-accent">
        <Icon.logo width={18} height={18} />
      </span>
      <span className="font-display text-[17px] font-extrabold tracking-[-0.01em] text-text">
        Wayforge
      </span>
    </button>
  );
}
