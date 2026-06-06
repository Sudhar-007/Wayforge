import { create } from "zustand";
import type {
  Roadmap,
  RoadmapNode,
  RoadmapResource,
  RoadmapListItem,
  NodeStatus,
  NodeType,
  EdgeType,
} from "../types/roadmap";
import {
  computeDagreLayout,
  NODE_SIZES,
  type NodePositions,
} from "../lib/layout";

/** Order the inline status toggle cycles through. */
const STATUS_CYCLE: NodeStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "skipped",
];

function nextStatus(current: NodeStatus): NodeStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

/** Vertical gap between a parent and a newly created child. */
const CHILD_Y_OFFSET = 120;
/** Horizontal gap between fanned-out siblings. */
const SIBLING_GAP = 80;

/** Fields of a node that are editable in the detail panel. */
type EditableNodeFields = Pick<
  RoadmapNode,
  "title" | "description" | "status" | "type"
>;

/** One rate-limit window as returned by GET /limits. */
type LimitWindow = {
  limit: number;
  used: number;
  remaining: number;
  resets_at: string;
};

/** Rate-limit status from GET /limits — the backend (Postgres counter) is the
 * source of truth; the "generations left" warning reads this, never a
 * client-side count. */
type GenerationLimits = {
  hour: LimitWindow;
  day: LimitWindow;
  global: LimitWindow;
};

/** Input for creating a branch off an existing node. */
export interface BranchInput {
  title: string;
  type: NodeType;
  edgeType: EdgeType;
}

/** Color theme. Mirrors the `data-theme` attribute on <html>. */
export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "wayforge_theme";

/** Read the persisted theme (falls back to the attribute set by the pre-paint
 * script in index.html, then to light). Safe outside the browser. */
function initialTheme(): Theme {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
  }
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  }
  return "light";
}

/** Which top-level screen is showing. */
export type AppView =
  | "home"
  | "login"
  | "intake"
  | "loading"
  | "viewer"
  | "profile"
  | "myRoadmaps";

/** Authenticated user, mirroring the backend's UserResponse schema. */
export interface User {
  id: string;
  github_id: string;
  github_username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const TOKEN_STORAGE_KEY = "pathfinder_token";

/** The intake form — its shape matches the backend's GenerateRequest exactly. */
export interface RoadmapForm {
  topic: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  weekly: string;
  goal: string;
  focus: string;
}

const INITIAL_FORM: RoadmapForm = {
  topic: "",
  level: "Beginner",
  weekly: "1-3 hours",
  goal: "",
  focus: "",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface RoadmapStore {
  roadmap: Roadmap | null;
  /** Node positions, seeded once by Dagre on load, then never auto-recalculated. */
  positions: NodePositions;
  selectedNodeId: string | null;
  /** Node whose inline branch-creator popover is currently open, if any. */
  branchingNodeId: string | null;

  // Color theme (light/dark). UI-only; flips `data-theme` on <html> and the
  // design tokens do the rest. Persisted to localStorage.
  theme: Theme;
  toggleTheme: () => void;

  // Which global modal is open, if any (currently just the manual-create dialog).
  modal: "manual" | null;
  openModal: (modal: "manual") => void;
  closeModal: () => void;

  // Front-of-funnel flow (home → intake → loading → viewer).
  view: AppView;
  form: RoadmapForm;
  generationError: string | null;
  /** Latest rate-limit status (GET /limits). Drives the "generations left"
   * warning; null until fetched. */
  generationLimits: GenerationLimits | null;
  fetchLimits: () => Promise<void>;

  // Authentication.
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loadCurrentUser: () => Promise<void>;
  initiateGitHubLogin: () => Promise<void>;

  // Saving the current roadmap to the user's account. `savedRoadmapId` + `isDirty`
  // are the source of truth for the save button; `saveStatus` only carries the
  // transient saving/error states (success resets it to "idle").
  savedRoadmapId: string | null;
  saveStatus: "idle" | "saving" | "error";
  /** True when the loaded roadmap has edits not yet persisted. */
  isDirty: boolean;
  /** POST a new row (first save, and the "Save as new copy" choice). */
  saveRoadmapToAccount: () => Promise<void>;
  /** PATCH the existing saved row in place (the "Update saved roadmap" choice). */
  updateSavedRoadmap: () => Promise<void>;
  /** Rename the open roadmap; persists immediately if it's already saved. */
  renameRoadmapTitle: (title: string) => Promise<void>;

  // The signed-in user's saved roadmaps (My Roadmaps screen).
  myRoadmaps: RoadmapListItem[];
  myRoadmapsStatus: "idle" | "loading" | "error";
  loadMyRoadmaps: () => Promise<void>;
  openRoadmap: (id: string) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
  /** Rename a saved roadmap by id (My Roadmaps cards), then refresh the list. */
  renameRoadmapById: (id: string, title: string) => Promise<void>;

  loadRoadmap: (roadmap: Roadmap) => void;
  /** Start a blank manual roadmap with the given title and open the editor. */
  createManualRoadmap: (title: string) => void;
  /** Seed the first node onto an empty canvas (guided empty-editor state). */
  addRootNode: () => void;
  selectNode: (id: string | null) => void;

  setView: (view: AppView) => void;
  setForm: (form: RoadmapForm) => void;
  generateRoadmap: () => Promise<void>;

  openBranchCreator: (id: string) => void;
  closeBranchCreator: () => void;

  cycleStatus: (id: string) => void;
  updateNode: (id: string, patch: Partial<EditableNodeFields>) => void;
  addResource: (id: string, resource: RoadmapResource) => void;
  removeResource: (id: string, index: number) => void;
  addChildNode: (parentId: string, input: BranchInput) => void;
  deleteNode: (id: string) => void;
}

/** Immutably apply `patch` to the node with `id` inside a roadmap. */
function patchNode(
  roadmap: Roadmap,
  id: string,
  patch: (node: RoadmapNode) => RoadmapNode,
): Roadmap {
  return {
    ...roadmap,
    nodes: roadmap.nodes.map((node) => (node.id === id ? patch(node) : node)),
  };
}

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  roadmap: null,
  positions: {},
  selectedNodeId: null,
  branchingNodeId: null,

  theme: initialTheme(),
  modal: null,

  view: "home",
  form: INITIAL_FORM,
  generationError: null,
  generationLimits: null,

  user: null,
  token:
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_STORAGE_KEY)
      : null,

  savedRoadmapId: null,
  saveStatus: "idle",
  isDirty: false,

  myRoadmaps: [],
  myRoadmapsStatus: "idle",

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    set({ user, token });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ user: null, token: null });
  },

  // Restore the logged-in user from a persisted token. Clears auth on 401 so a
  // stale/expired token doesn't leave the UI in a half-logged-in state.
  loadCurrentUser: async () => {
    const { token, clearAuth } = get();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAuth();
        return;
      }
      if (!res.ok) return;
      set({ user: (await res.json()) as User });
    } catch {
      // Network error — keep the token; loadCurrentUser will retry next mount.
    }
  },

  // Kick off the OAuth flow: ask the backend for the GitHub authorize URL, then
  // hand the browser off to GitHub.
  initiateGitHubLogin: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/github`);
    if (!res.ok) {
      set({ generationError: "Could not start GitHub login. Is the backend running?" });
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  },

  // Persist the current roadmap as a NEW row via POST /roadmaps. Used for the
  // first save and for the "Save as new copy" choice. The body matches the
  // backend RoadmapCreate schema; `data` is the full live roadmap so saved
  // progress reflects any inline edits. Success clears the dirty flag and points
  // savedRoadmapId at the freshly created row.
  saveRoadmapToAccount: async () => {
    const { roadmap, form, token } = get();
    if (!token || !roadmap) return;

    set({ saveStatus: "saving" });
    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: roadmap.title || `${form.topic} Roadmap`,
          topic: form.topic,
          level: form.level,
          weekly: form.weekly,
          goal: form.goal,
          focus: form.focus,
          data: roadmap,
        }),
      });

      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      const saved = await res.json();
      set({ savedRoadmapId: saved.id, saveStatus: "idle", isDirty: false });
    } catch (err) {
      console.error("[saveRoadmapToAccount]", err);
      set({ saveStatus: "error" });
    }
  },

  // Overwrite the existing saved row in place via PATCH /roadmaps/{id}. Used for
  // the "Update saved roadmap" choice. Sends the full mutable body so data and
  // metadata stay in sync. Success clears the dirty flag.
  updateSavedRoadmap: async () => {
    const { roadmap, form, token, savedRoadmapId } = get();
    if (!token || !roadmap || !savedRoadmapId) return;

    set({ saveStatus: "saving" });
    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps/${savedRoadmapId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: roadmap.title || `${form.topic} Roadmap`,
          topic: form.topic,
          level: form.level,
          weekly: form.weekly,
          goal: form.goal,
          focus: form.focus,
          data: roadmap,
        }),
      });

      if (!res.ok) throw new Error(`Update failed (${res.status})`);

      set({ saveStatus: "idle", isDirty: false });
    } catch (err) {
      console.error("[updateSavedRoadmap]", err);
      set({ saveStatus: "error" });
    }
  },

  // Rename the currently open roadmap. Updates local state immediately; if the
  // roadmap is already saved, persists the title on its own via a partial PATCH.
  // Leaves `isDirty` untouched — any other pending edits still need a full save.
  renameRoadmapTitle: async (title) => {
    const { roadmap, token, savedRoadmapId } = get();
    if (!roadmap) return;

    const trimmed = title.trim();
    if (!trimmed || trimmed === roadmap.title) return;

    set({ roadmap: { ...roadmap, title: trimmed } });

    if (!savedRoadmapId || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps/${savedRoadmapId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`Rename failed (${res.status})`);
    } catch (err) {
      console.error("[renameRoadmapTitle]", err);
    }
  },

  // Fetch the signed-in user's saved roadmaps (lightweight list rows) for the
  // My Roadmaps screen. Status drives the loading skeleton / empty / error UI.
  loadMyRoadmaps: async () => {
    const { token } = get();
    if (!token) return;

    set({ myRoadmapsStatus: "loading" });
    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`List failed (${res.status})`);
      const items = (await res.json()) as RoadmapListItem[];
      set({ myRoadmaps: items, myRoadmapsStatus: "idle" });
    } catch (err) {
      console.error("[loadMyRoadmaps]", err);
      set({ myRoadmapsStatus: "error" });
    }
  },

  // Load a saved roadmap into the viewer. GET /roadmaps/{id} returns the full
  // RoadmapResponse; the graph lives in `.data`. The top-level `title` column is
  // authoritative (a title-only rename updates it without touching `data.title`),
  // so it wins when hydrating the document. We also hydrate `form` so the viewer
  // header subtitle is correct, and mark it as the currently-saved row.
  openRoadmap: async (id) => {
    const { token, loadRoadmap } = get();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Open failed (${res.status})`);
      const saved = await res.json();

      // The title column is authoritative; overlay it onto the loaded document.
      loadRoadmap({
        ...(saved.data as Roadmap),
        title: saved.title ?? (saved.data as Roadmap).title,
      });
      set({
        form: {
          topic: saved.topic ?? "",
          level: saved.level ?? "Beginner",
          weekly: saved.weekly ?? "1-3 hours",
          goal: saved.goal ?? "",
          focus: saved.focus ?? "",
        },
        savedRoadmapId: saved.id,
        saveStatus: "idle",
        isDirty: false,
        view: "viewer",
      });
    } catch (err) {
      console.error("[openRoadmap]", err);
    }
  },

  // Delete a saved roadmap, then refresh the list so the UI reflects the change.
  deleteRoadmap: async (id) => {
    const { token, loadMyRoadmaps } = get();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete failed (${res.status})`);
      }
      await loadMyRoadmaps();
    } catch (err) {
      console.error("[deleteRoadmap]", err);
    }
  },

  // Rename a saved roadmap by id (from a My Roadmaps card). Persists via partial
  // PATCH, refreshes the list so the card updates, and keeps the live viewer
  // title in sync if that same roadmap happens to be open.
  renameRoadmapById: async (id, title) => {
    const { token, loadMyRoadmaps, roadmap, savedRoadmapId } = get();
    if (!token) return;

    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/roadmaps/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`Rename failed (${res.status})`);

      if (roadmap && savedRoadmapId === id) {
        set({ roadmap: { ...roadmap, title: trimmed } });
      }
      await loadMyRoadmaps();
    } catch (err) {
      console.error("[renameRoadmapById]", err);
    }
  },

  // Dagre runs exactly once here. Subsequent edits never trigger relayout.
  // A fresh load (generate or open) starts clean — no unsaved edits.
  loadRoadmap: (roadmap) =>
    set({ roadmap, positions: computeDagreLayout(roadmap), isDirty: false }),

  // Manual path: start from a blank canvas with just a title. No backend call —
  // the empty roadmap goes straight into the viewer, where the guided
  // empty-editor state prompts the user to add their first node. Save state is
  // reset so it behaves like a brand-new, unsaved roadmap.
  createManualRoadmap: (title) =>
    set({
      roadmap: {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled roadmap",
        description: "",
        nodes: [],
        edges: [],
      },
      positions: {},
      form: INITIAL_FORM,
      selectedNodeId: null,
      branchingNodeId: null,
      savedRoadmapId: null,
      saveStatus: "idle",
      isDirty: false,
      modal: null,
      view: "viewer",
    }),

  // Seed the first node onto an empty canvas (the "Add your first node" action in
  // the empty-editor state). Places a single primary node near the top-center and
  // selects it so the detail panel opens for immediate editing. Subsequent nodes
  // are added via the existing hover-"+" branch flow (addChildNode).
  addRootNode: () =>
    set((state) => {
      if (!state.roadmap) return state;

      const newId = crypto.randomUUID();
      const newNode: RoadmapNode = {
        id: newId,
        title: "First topic",
        description: "",
        type: "primary",
        status: "not_started",
        resources: [],
      };
      const size = NODE_SIZES.primary;

      return {
        roadmap: {
          ...state.roadmap,
          nodes: [...state.roadmap.nodes, newNode],
        },
        positions: { ...state.positions, [newId]: { x: -size.width / 2, y: 40 } },
        selectedNodeId: newId,
        isDirty: true,
      };
    }),

  selectNode: (id) => set({ selectedNodeId: id }),

  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
      return { theme };
    }),

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  setView: (view) => set({ view }),
  setForm: (form) => set({ form }),

  // Submit the intake form to the structured backend endpoint and route the
  // result into the existing viewer. Drives loading → viewer (success) or
  // loading → intake (error). Never silently transforms the response.
  generateRoadmap: async () => {
    const { form, token, loadRoadmap, clearAuth } = get();

    // Generation is authenticated-only (the backend enforces this with a 401).
    // Guard up front so logged-out users are routed to login rather than seeing
    // a failed request.
    if (!token) {
      set({
        generationError: "Please sign in with GitHub to generate a roadmap.",
        view: "login",
      });
      return;
    }

    set({ view: "loading", generationError: null });

    try {
      const res = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      // Token missing/expired/invalid — drop the stale session and re-login.
      if (res.status === 401) {
        clearAuth();
        set({
          generationError: "Your session expired — please sign in again.",
          view: "login",
        });
        return;
      }

      // Rate limited — surface the backend's message + retry timing gracefully.
      if (res.status === 429) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail ?? {};
        const mins = detail.retry_after_seconds
          ? Math.ceil(detail.retry_after_seconds / 60)
          : null;
        const when = mins ? ` Try again in about ${mins} min.` : "";
        set({
          generationError:
            (detail.message ?? "You've hit the generation rate limit.") + when,
          view: "intake",
        });
        return;
      }

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const body = await res.json();
          // Only use string details; structured details are handled above.
          if (typeof body?.detail === "string") detail = body.detail;
        } catch {
          // non-JSON error body; keep the status message
        }
        throw new Error(detail);
      }

      const data = await res.json();

      if (Array.isArray(data?.nodes) && Array.isArray(data?.edges)) {
        loadRoadmap(data as Roadmap);
        // Fresh roadmap — it hasn't been saved yet, so reset the save state.
        set({ view: "viewer", savedRoadmapId: null, saveStatus: "idle" });
        // This generate consumed one; refresh remaining from the backend.
        void get().fetchLimits();
      } else {
        console.error(
          "[generateRoadmap] schema mismatch — expected a Roadmap with " +
            "nodes[]/edges[] per src/types/roadmap.ts, received:",
          data,
        );
        set({
          generationError:
            "Backend returned an incompatible roadmap schema. The pipeline " +
            "output needs to be updated to match src/types/roadmap.ts.",
          view: "intake",
        });
      }
    } catch (err) {
      set({
        generationError: err instanceof Error ? err.message : String(err),
        view: "intake",
      });
    }
  },

  // Read current rate-limit status from the backend (source of truth). Non-fatal
  // on failure — the warning simply won't render.
  fetchLimits: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/limits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      set({ generationLimits: (await res.json()) as GenerationLimits });
    } catch {
      // ignore — non-blocking warning
    }
  },

  openBranchCreator: (id) => set({ branchingNodeId: id }),
  closeBranchCreator: () => set({ branchingNodeId: null }),

  cycleStatus: (id) =>
    set((state) =>
      state.roadmap
        ? {
            roadmap: patchNode(state.roadmap, id, (node) => ({
              ...node,
              status: nextStatus(node.status),
            })),
            isDirty: true,
          }
        : state,
    ),

  updateNode: (id, patch) =>
    set((state) =>
      state.roadmap
        ? {
            roadmap: patchNode(state.roadmap, id, (node) => ({
              ...node,
              ...patch,
            })),
            isDirty: true,
          }
        : state,
    ),

  addResource: (id, resource) =>
    set((state) =>
      state.roadmap
        ? {
            roadmap: patchNode(state.roadmap, id, (node) => ({
              ...node,
              resources: [...node.resources, resource],
            })),
            isDirty: true,
          }
        : state,
    ),

  removeResource: (id, index) =>
    set((state) =>
      state.roadmap
        ? {
            roadmap: patchNode(state.roadmap, id, (node) => ({
              ...node,
              resources: node.resources.filter((_, i) => i !== index),
            })),
            isDirty: true,
          }
        : state,
    ),

  addChildNode: (parentId, input) =>
    set((state) => {
      const parentPos = state.positions[parentId];
      const parentNode = state.roadmap?.nodes.find((n) => n.id === parentId);
      if (!state.roadmap || !parentPos || !parentNode) return state;

      const newId = crypto.randomUUID();
      const newNode: RoadmapNode = {
        id: newId,
        title: input.title.trim() || "Untitled",
        description: "",
        type: input.type,
        status: "not_started",
        resources: [],
      };
      const newEdge = {
        id: crypto.randomUUID(),
        source: parentId,
        target: newId,
        type: input.edgeType,
      };

      // All direct children of this parent (existing ones in edge order, then
      // the new one), re-centered together under the parent. Fan-out math uses
      // the new child's type width per spec. Only these siblings move; unrelated
      // nodes are untouched.
      const siblingIds = [
        ...state.roadmap.edges
          .filter((e) => e.source === parentId)
          .map((e) => e.target),
        newId,
      ];
      const n = siblingIds.length;
      const nodeWidth = NODE_SIZES[input.type].width;
      const parentWidth = NODE_SIZES[parentNode.type].width;
      const totalWidth = n * nodeWidth + (n - 1) * SIBLING_GAP;
      const startX = parentPos.x + parentWidth / 2 - totalWidth / 2;
      const y = parentPos.y + CHILD_Y_OFFSET;

      const positions = { ...state.positions };
      siblingIds.forEach((sid, i) => {
        positions[sid] = { x: startX + i * (nodeWidth + SIBLING_GAP), y };
      });

      return {
        roadmap: {
          ...state.roadmap,
          nodes: [...state.roadmap.nodes, newNode],
          edges: [...state.roadmap.edges, newEdge],
        },
        positions,
        branchingNodeId: null,
        isDirty: true,
      };
    }),

  deleteNode: (id) =>
    set((state) => {
      if (!state.roadmap) return state;

      const positions = { ...state.positions };
      delete positions[id];

      return {
        roadmap: {
          ...state.roadmap,
          nodes: state.roadmap.nodes.filter((n) => n.id !== id),
          // Drop any edge that references the deleted node. The visual gap stays.
          edges: state.roadmap.edges.filter(
            (e) => e.source !== id && e.target !== id,
          ),
        },
        positions,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        branchingNodeId:
          state.branchingNodeId === id ? null : state.branchingNodeId,
        isDirty: true,
      };
    }),
}));
