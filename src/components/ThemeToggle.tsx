import { useRoadmapStore } from "../store/roadmapStore";
import { Icon } from "./icons";

/** Sun/moon button that flips the app between light and dark themes. */
export function ThemeToggle({ size = 36 }: { size?: number }) {
  const theme = useRoadmapStore((s) => s.theme);
  const toggleTheme = useRoadmapStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Toggle theme"
      aria-label="Toggle theme"
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-md border border-border bg-surface text-text-2 transition hover:border-border-strong hover:bg-surface-2 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {theme === "light" ? <Icon.moon /> : <Icon.sun />}
    </button>
  );
}
