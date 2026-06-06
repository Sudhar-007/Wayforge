import { Icon } from "./icons";

/** Wayforge logo mark + wordmark. Clickable when an onClick is provided. */
export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="Wayforge home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-on shadow-sm">
        <Icon.logo />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-text">
        Wayforge
      </span>
    </button>
  );
}
