import { useRoadmapStore } from "../store/roadmapStore";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { AppMenu } from "./AppMenu";
import { Icon } from "./icons";

/** Marketing nav shown on the Home screen: brand left, actions right. */
export function Nav() {
  const setView = useRoadmapStore((s) => s.setView);
  const user = useRoadmapStore((s) => s.user);

  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Brand onClick={() => setView("home")} />
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              onClick={() => setView("myRoadmaps")}
              className="hidden h-9 items-center rounded-md px-3 text-sm font-semibold text-text-2 transition hover:bg-surface-3 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:inline-flex"
            >
              My roadmaps
            </button>
          )}
          <ThemeToggle />
          <AppMenu />
        </div>
      </div>
    </header>
  );
}

/** Internal top bar (intake / login / profile / lists): optional back + brand. */
export function TopBar({
  onBack,
  backLabel = "Back",
}: {
  onBack?: () => void;
  backLabel?: string;
}) {
  const setView = useRoadmapStore((s) => s.setView);

  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-2 transition hover:text-text focus:outline-none focus-visible:underline"
            >
              <Icon.back /> {backLabel}
            </button>
          )}
          <Brand onClick={() => setView("home")} />
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <AppMenu />
        </div>
      </div>
    </header>
  );
}
