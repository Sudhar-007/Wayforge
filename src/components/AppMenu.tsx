import { useEffect, useRef, useState } from "react";
import { useRoadmapStore } from "../store/roadmapStore";

/**
 * Top-left navigation menu for signed-in users. A button (the user's avatar, or
 * a hamburger fallback) opens a dropdown with profile / roadmaps / sign-out.
 * Renders nothing when logged out. Positioned by its parent (App renders it
 * fixed in the top-left corner).
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

  if (!user) return null;

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
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full"
          />
        ) : (
          <HamburgerIcon />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.github_username}
            </p>
            {user.email && (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            )}
          </div>
          <div className="h-px bg-slate-100" />
          <MenuItem onClick={() => go("profile")}>My Profile</MenuItem>
          <MenuItem onClick={() => go("myRoadmaps")}>My Roadmaps</MenuItem>
          <div className="my-1 h-px bg-slate-100" />
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
      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 ${
        destructive ? "text-red-600" : "text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
