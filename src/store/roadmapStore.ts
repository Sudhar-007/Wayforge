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

/** Input for creating a branch off an existing node. */
export interface BranchInput {
  title: string;
  type: NodeType;
  edgeType: EdgeType;
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

  // Front-of-funnel flow (home → intake → loading → viewer).
  view: AppView;
  form: RoadmapForm;
  generationError: string | null;

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

  view: "home",
  form: INITIAL_FORM,
  generationError: null,

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

  selectNode: (id) => set({ selectedNodeId: id }),

  setView: (view) => set({ view }),
  setForm: (form) => set({ form }),

  // Submit the intake form to the structured backend endpoint and route the
  // result into the existing viewer. Drives loading → viewer (success) or
  // loading → intake (error). Never silently transforms the response.
  generateRoadmap: async () => {
    set({ view: "loading", generationError: null });
    const { form, token, loadRoadmap } = get();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // /generate is open to anonymous users; send the token when we have one so
      // future user-scoped persistence can attribute the roadmap.
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
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
