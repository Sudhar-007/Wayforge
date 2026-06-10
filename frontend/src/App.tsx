import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useRoadmapStore } from "./store/roadmapStore";
import { RoadmapCanvas } from "./components/RoadmapCanvas";
import { DetailPanel } from "./components/DetailPanel";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Intake } from "./components/Intake";
import { Loading } from "./components/Loading";
import { ViewerHeader } from "./components/ViewerHeader";
import { Profile } from "./components/Profile";
import { MyRoadmaps } from "./components/MyRoadmaps";
import { CreateManualModal } from "./components/CreateManualModal";

// Auth-callback loading copy (module-scope so the array reference is stable).
const AUTH_MESSAGES = ["Signing you in…", "Setting up your account…"];
const AUTH_SUBTITLE =
  "Waking up the server — this can take a few seconds on the first visit.";

export default function App() {
  const view = useRoadmapStore((s) => s.view);
  const modal = useRoadmapStore((s) => s.modal);

  // Authentication bootstrap, runs once on mount:
  //  - If we landed on the OAuth callback (/auth/callback?token=...), capture the
  //    token, populate the user, strip the token from the URL, and route onward.
  //  - Otherwise, restore any persisted session.
  useEffect(() => {
    const { setAuth, loadCurrentUser, setView, resumePendingCreation } =
      useRoadmapStore.getState();

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
              // Resume whichever creation path the user picked before login
              // (defaults to the AI intake).
              resumePendingCreation();
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

  return (
    <div className="min-h-screen bg-bg text-text antialiased">
      {/* Nav chrome (brand + theme toggle + account menu) is rendered per-screen
          by each view via Nav/TopBar/ViewerHeader, not as a global overlay. */}
      {view === "home" && <Home />}
      {view === "login" && <Login />}
      {view === "intake" && <Intake />}
      {view === "loading" && <Loading />}
      {view === "authCallback" && (
        <Loading messages={AUTH_MESSAGES} subtitle={AUTH_SUBTITLE} />
      )}
      {view === "profile" && <Profile />}
      {view === "myRoadmaps" && <MyRoadmaps />}
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

      {/* Global modals. */}
      {modal === "manual" && <CreateManualModal />}
    </div>
  );
}
