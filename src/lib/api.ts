import type { Roadmap } from "../types/roadmap";

/**
 * Persistence stub.
 *
 * Phase 1 keeps all edits in local (Zustand) state. This function is the single
 * seam where persistence will be wired up later — it will become a
 * `PUT /roadmaps/:id` call to the FastAPI backend. For now it just resolves so
 * callers (debounced autosave) can treat saving as async today.
 */
export async function saveRoadmap(roadmap: Roadmap): Promise<void> {
  // TODO(phase-later): replace with real persistence, e.g.
  //   await fetch(`${API_BASE}/roadmaps/${roadmap.id}`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(roadmap),
  //   });
  console.debug("[saveRoadmap] (stub) persisting roadmap", roadmap.id);
  return Promise.resolve();
}
