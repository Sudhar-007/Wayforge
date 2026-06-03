import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useRoadmapStore } from "./store/roadmapStore";
import { useDebouncedCallback } from "./lib/useDebouncedCallback";
import { saveRoadmap } from "./lib/api";
import { RoadmapCanvas } from "./components/RoadmapCanvas";
import { DetailPanel } from "./components/DetailPanel";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Intake } from "./components/Intake";
import { Loading } from "./components/Loading";
import { ViewerHeader } from "./components/ViewerHeader";
import type { Roadmap } from "./types/roadmap";

export default function App() {
  const view = useRoadmapStore((s) => s.view);
  const roadmap = useRoadmapStore((s) => s.roadmap);

  // Authentication bootstrap, runs once on mount:
  //  - If we landed on the OAuth callback (/auth/callback?token=...), capture the
  //    token, populate the user, strip the token from the URL, and route onward.
  //  - Otherwise, restore any persisted session.
  useEffect(() => {
    const { setAuth, loadCurrentUser, setView } = useRoadmapStore.getState();

    if (window.location.pathname === "/auth/callback") {
      const token = new URLSearchParams(window.location.search).get("token");
      // Clean the token out of the address bar / history regardless of outcome.
      window.history.replaceState({}, "", "/");

      if (token) {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
        void (async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setAuth(await res.json(), token);
              setView("intake");
              return;
            }
          } catch {
            // fall through to home on any failure
          }
          setView("home");
        })();
      }
      return;
    }

    void loadCurrentUser();
  }, []);

  // Debounced autosave (200ms). Wired to the saveRoadmap() stub today; becomes
  // a backend call later. Skips the first roadmap load so we only persist edits.
  const debouncedSave = useDebouncedCallback((r: Roadmap) => {
    void saveRoadmap(r);
  }, 200);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!roadmap) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    debouncedSave(roadmap);
  }, [roadmap, debouncedSave]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {view === "home" && <Home />}
      {view === "login" && <Login />}
      {view === "intake" && <Intake />}
      {view === "loading" && <Loading />}
      {view === "viewer" && (
        <div className="flex h-screen flex-col">
          <ViewerHeader />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1">
              <ReactFlowProvider>
                <RoadmapCanvas />
              </ReactFlowProvider>
            </main>
            <DetailPanel />
          </div>
        </div>
      )}
    </div>
  );
}
