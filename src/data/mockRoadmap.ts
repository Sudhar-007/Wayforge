import type { Roadmap } from "../types/roadmap";
// Canonical example payload at the repo root. For Phase 1 the frontend reads
// this directly; later it will be replaced by a fetch from the FastAPI backend.
import raw from "../../mock-roadmap.json";

const mockRoadmap = raw as Roadmap;

export default mockRoadmap;
