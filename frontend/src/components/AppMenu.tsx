import { useEffect, useRef, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";
import { Icon } from "./icons";

/**
 * Account control for the nav chrome. When signed in, an avatar button opens a
 * dropdown (profile / roadmaps / sign-out). When signed out, it renders a "Sign
 * in" button instead, so the nav works in both states. (Previously this returned
 * null when logged out and was a fixed top-left overlay; it now lives inside the
 * Nav/TopBar/ViewerHeader chrome.)
 */
export function AppMenu() {
  const user = useRoadmapStore((s) => s.user);
  const setView = useRoadmapStore((s) => s.setView);
  const clearAuth = useRoadmapStore((s) => s.clearAuth);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while the menu is open.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <button
        onClick={() => setView("login")}
        className="inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-sm font-semibold text-text transition hover:bg-surface-2 hover:border-text-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        Sign in
      </button>
    );
  }

  const go = (view: "profile" | "myRoadmaps") => {
    setOpen(false);
    setView(view);
  };

  const signOut = () => {
    setOpen(false);
    clearAuth();
    setView("home");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-text-2 transition hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon.user />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-text">
              {user.github_username}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-xs text-text-3">{user.email}</p>
            )}
          </div>
          <hr className="border-border" />
          <MenuItem onClick={() => go("profile")}>My profile</MenuItem>
          <MenuItem onClick={() => go("myRoadmaps")}>My roadmaps</MenuItem>
          <hr className="my-1 border-border" />
          <MenuItem onClick={signOut} destructive>
            Sign out
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  destructive = false,
  children,
}: {
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 ${
        destructive ? "text-danger" : "text-text-2 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
