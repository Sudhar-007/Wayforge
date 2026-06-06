/* ============================================================================
   WAYFORGE — global store (Zustand-style, framework-free)
   Mirrors the real app's roadmapStore: view router, theme, roadmap doc,
   selection, and node mutations. Read with useStore(selector).
   ========================================================================== */

const NODE_SIZE = {
  section_header: { w: 234, h: 46 },
  primary:        { w: 212, h: 48 },
  secondary:      { w: 180, h: 42 },
};

/* Seed roadmap — trimmed Frontend path covering every node type, all four
   statuses, and required + optional edges. Hand-positioned for a clean spine. */
const ROADMAP_SEED = () => ({
  title: "Frontend Developer Roadmap",
  topic: "Frontend Development",
  level: "Beginner",
  nodes: [
    { id: "n1",  type: "section_header", status: "completed",   x: 183, y: 36,  title: "Web Fundamentals",
      description: "Foundational technologies of the web before tooling and frameworks.", resources: [] },
    { id: "n2",  type: "primary", status: "completed",   x: 194, y: 118, title: "HTML",
      description: "Semantic markup, document structure, forms, and accessibility basics — the skeleton of every page.",
      resources: [{ label: "HTML on MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "docs" }] },
    { id: "n3",  type: "primary", status: "in_progress", x: 194, y: 208, title: "CSS",
      description: "Selectors, the box model, layout systems (`flexbox`, `grid`), and responsive design.",
      resources: [{ label: "A Complete Guide to Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", type: "article" }] },
    { id: "n4",  type: "secondary", status: "not_started", x: 520, y: 211, title: "Responsive Design",
      description: "Media queries, fluid units, and mobile-first principles so layouts adapt across screens.", resources: [] },
    { id: "n5",  type: "primary", status: "not_started", x: 194, y: 298, title: "JavaScript",
      description: "Variables, functions, the DOM, events, and asynchronous code (`Promises`, `async/await`).",
      resources: [{ label: "JavaScript.info", url: "https://javascript.info/", type: "course" }] },
    { id: "n6",  type: "secondary", status: "skipped", x: 520, y: 301, title: "TypeScript",
      description: "Optional: static typing on top of JavaScript for safer, more maintainable code.", resources: [] },
    { id: "n7",  type: "section_header", status: "not_started", x: 183, y: 396, title: "Tooling & Workflow",
      description: "The developer tooling that supports modern frontend work.", resources: [] },
    { id: "n8",  type: "primary", status: "completed", x: 194, y: 478, title: "Version Control (Git)",
      description: "Track changes, branch, merge, and collaborate using Git and a platform like GitHub.",
      resources: [{ label: "Git & GitHub Crash Course", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "video" }] },
    { id: "n9",  type: "primary", status: "not_started", x: 194, y: 568, title: "Build Tools (Vite)",
      description: "Modern bundlers like **Vite**: dev servers, hot module replacement, production builds.", resources: [] },
    { id: "n10", type: "secondary", status: "not_started", x: 520, y: 571, title: "Linters & Formatters",
      description: "Optional: enforce consistency with ESLint and Prettier across a team.", resources: [] },
    { id: "n11", type: "section_header", status: "not_started", x: 183, y: 666, title: "Frameworks",
      description: "Component-based UI frameworks and the ecosystem around them.", resources: [] },
    { id: "n12", type: "primary", status: "not_started", x: 194, y: 748, title: "Pick a Framework",
      description: "Learn a component-based framework. **React** is the most in-demand; Vue and Svelte are great too.", resources: [] },
    { id: "n13", type: "primary", status: "not_started", x: 194, y: 838, title: "Testing",
      description: "Write unit and integration tests with Vitest, Jest, and Testing Library.", resources: [] },
    { id: "n14", type: "primary", status: "not_started", x: 194, y: 928, title: "Deployment",
      description: "Ship to the web with Netlify, Vercel, or Cloudflare Pages and CI/CD.", resources: [] },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "required" },
    { id: "e2", source: "n2", target: "n3", type: "required" },
    { id: "e3", source: "n3", target: "n4", type: "optional" },
    { id: "e4", source: "n3", target: "n5", type: "required" },
    { id: "e5", source: "n5", target: "n6", type: "optional" },
    { id: "e6", source: "n5", target: "n7", type: "required" },
    { id: "e7", source: "n7", target: "n8", type: "required" },
    { id: "e8", source: "n8", target: "n9", type: "required" },
    { id: "e9", source: "n9", target: "n10", type: "optional" },
    { id: "e10", source: "n9", target: "n11", type: "required" },
    { id: "e11", source: "n11", target: "n12", type: "required" },
    { id: "e12", source: "n12", target: "n13", type: "required" },
    { id: "e13", source: "n13", target: "n14", type: "required" },
  ],
});

const SAVED_ROADMAPS = [
  { id: "r1", title: "Frontend Developer Roadmap", topic: "Frontend Development", level: "Beginner",   created: "May 28, 2026", progress: 38 },
  { id: "r2", title: "Machine Learning Foundations", topic: "Machine Learning", level: "Intermediate", created: "May 21, 2026", progress: 12 },
  { id: "r3", title: "DevOps & Cloud Engineering", topic: "DevOps", level: "Advanced",                 created: "May 09, 2026", progress: 64 },
  { id: "r4", title: "Rust for Systems Programming", topic: "Rust", level: "Intermediate",             created: "Apr 30, 2026", progress: 0 },
];

const USER = {
  github_username: "sudhar-007",
  email: "sudhar@wayforge.page",
  avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
};

const STATUS_ORDER = ["not_started", "in_progress", "completed", "skipped"];

/* ---- minimal external store ---- */
const store = (function () {
  let uid = 100;
  let state = {
    view: "home",          // home | intake | loading | viewer | myRoadmaps | login | profile
    theme: localStorage.getItem("wf-theme") || "light",
    user: USER,
    modal: null,           // 'manual' | null
    roadmap: ROADMAP_SEED(),
    selectedId: null,
    branchingId: null,
    saved: SAVED_ROADMAPS,
    form: { topic: "", level: "Beginner", weekly: "4-7 hours", goal: "", focus: "" },
    savedState: "unsaved", // unsaved | saving | saved | dirty
  };
  const subs = new Set();
  const get = () => state;
  const set = (patch) => {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    subs.forEach((f) => f());
  };
  const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
  const nextId = () => "x" + (++uid);
  return { get, set, subscribe, nextId };
})();

function useStore(selector) {
  return React.useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

/* ---- actions ---- */
const actions = {
  setView: (view) => store.set({ view }),
  toggleTheme: () => store.set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  openModal: (modal) => store.set({ modal }),
  closeModal: () => store.set({ modal: null }),
  setForm: (patch) => store.set((s) => ({ form: { ...s.form, ...patch } })),

  selectNode: (id) => store.set({ selectedId: id, branchingId: null }),
  openBranch: (id) => store.set((s) => ({ branchingId: s.branchingId === id ? null : id })),

  cycleStatus: (id) => store.set((s) => {
    const nodes = s.roadmap.nodes.map((n) => {
      if (n.id !== id) return n;
      const i = STATUS_ORDER.indexOf(n.status);
      return { ...n, status: STATUS_ORDER[(i + 1) % STATUS_ORDER.length] };
    });
    return { roadmap: { ...s.roadmap, nodes }, savedState: s.savedState === "unsaved" ? "unsaved" : "dirty" };
  }),

  updateNode: (id, patch) => store.set((s) => ({
    roadmap: { ...s.roadmap, nodes: s.roadmap.nodes.map((n) => n.id === id ? { ...n, ...patch } : n) },
    savedState: s.savedState === "unsaved" ? "unsaved" : "dirty",
  })),

  addResource: (id, res) => store.set((s) => ({
    roadmap: { ...s.roadmap, nodes: s.roadmap.nodes.map((n) => n.id === id ? { ...n, resources: [...n.resources, res] } : n) },
  })),
  removeResource: (id, idx) => store.set((s) => ({
    roadmap: { ...s.roadmap, nodes: s.roadmap.nodes.map((n) => n.id === id ? { ...n, resources: n.resources.filter((_, i) => i !== idx) } : n) },
  })),

  deleteNode: (id) => store.set((s) => ({
    selectedId: null,
    roadmap: {
      ...s.roadmap,
      nodes: s.roadmap.nodes.filter((n) => n.id !== id),
      edges: s.roadmap.edges.filter((e) => e.source !== id && e.target !== id),
    },
  })),

  renameRoadmap: (title) => store.set((s) => ({ roadmap: { ...s.roadmap, title } })),

  /* branch a child below a parent */
  addBranch: (parentId, title, type) => store.set((s) => {
    const parent = s.roadmap.nodes.find((n) => n.id === parentId);
    const id = store.nextId();
    const node = {
      id, type: type || "primary", status: "not_started",
      x: (parent ? parent.x : 200) + 250, y: (parent ? parent.y : 200) + 60,
      title: title || "New topic", description: "", resources: [],
    };
    return {
      branchingId: null, selectedId: id,
      roadmap: { ...s.roadmap, nodes: [...s.roadmap.nodes, node], edges: [...s.roadmap.edges, { id: store.nextId(), source: parentId, target: id, type: "required" }] },
    };
  }),

  /* manual create → empty roadmap → editor */
  createManual: (title) => store.set({
    roadmap: { title: title || "Untitled roadmap", topic: "", level: "", nodes: [], edges: [] },
    selectedId: null, view: "viewer", modal: null, savedState: "unsaved",
  }),

  addFirstNode: () => store.set((s) => {
    const id = store.nextId();
    const node = { id, type: "primary", status: "not_started", x: 200, y: 120, title: "First topic", description: "", resources: [] };
    return { roadmap: { ...s.roadmap, nodes: [node], edges: [] }, selectedId: id };
  }),

  /* AI generate (mock latency).
     Outcome is normally "success". For demo/preview, a topic containing
     "fail"/"error" → error state; "empty"/"nothing"/"asdf" → no-results state. */
  generate: () => {
    const topic = (store.get().form.topic || "").toLowerCase();
    let outcome = "success";
    if (/\b(fail|error|crash)\b/.test(topic)) outcome = "error";
    else if (/\b(empty|nothing|none|asdf|qwer)\b/.test(topic)) outcome = "noResults";
    store.set((s) => ({ view: "loading", selectedId: null }));
    setTimeout(() => {
      if (outcome === "success") {
        store.set((s) => ({ view: "viewer", roadmap: { ...ROADMAP_SEED(), title: s.form.topic ? s.form.topic + " Roadmap" : "Your Learning Roadmap", topic: s.form.topic || "Your topic" }, savedState: "unsaved" }));
      } else {
        store.set({ view: outcome });
      }
    }, outcome === "success" ? 2100 : 1700);
  },

  openSaved: (id) => store.set((s) => {
    const item = s.saved.find((r) => r.id === id);
    return { roadmap: { ...ROADMAP_SEED(), title: item ? item.title : "Roadmap", topic: item ? item.topic : "" }, view: "viewer", selectedId: null, savedState: "saved" };
  }),

  save: () => {
    store.set({ savedState: "saving" });
    setTimeout(() => store.set({ savedState: "saved" }), 900);
  },

  signOut: () => store.set({ user: null, view: "home" }),
  signIn: () => store.set({ user: USER, view: "home" }),
};

Object.assign(window, { store, useStore, actions, NODE_SIZE, STATUS_ORDER });
