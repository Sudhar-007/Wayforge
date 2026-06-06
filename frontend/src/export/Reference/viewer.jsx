/* ============================================================================
   WAYFORGE — Roadmap viewer (custom DAG), detail panel, empty editor
   Keeps node types (section_header / primary / secondary), all four statuses,
   required + optional edges, and the 360px detail panel — restyled.
   ========================================================================== */
const { useState: useV, useEffect: useVE, useRef: useVR, useCallback: useVC } = React;

/* ---- status tint for primary/secondary nodes ---- */
function nodeTint(status) {
  const map = {
    not_started: { b: "var(--node-border)", bg: "var(--node-surface)" },
    in_progress: { b: "var(--status-prog)", bg: "color-mix(in srgb, var(--status-prog) 9%, var(--node-surface))" },
    completed:   { b: "var(--status-done)", bg: "color-mix(in srgb, var(--status-done) 9%, var(--node-surface))" },
    skipped:     { b: "var(--status-skip)", bg: "color-mix(in srgb, var(--status-skip) 7%, var(--node-surface))" },
  };
  return map[status];
}

/* ---- edge path geometry ---- */
function edgePath(s, t) {
  const ss = NODE_SIZE[s.type], ts = NODE_SIZE[t.type];
  const scx = s.x + ss.w / 2, scy = s.y + ss.h / 2, tcx = t.x + ts.w / 2, tcy = t.y + ts.h / 2;
  const horiz = Math.abs(tcy - scy) < 60 && Math.abs(tcx - scx) > 120;
  if (horiz) {
    const dir = tcx > scx ? 1 : -1;
    const sx = dir > 0 ? s.x + ss.w : s.x, sy = scy;
    const ex = dir > 0 ? t.x : t.x + ts.w, ey = tcy;
    const dx = Math.abs(ex - sx);
    return `M${sx},${sy} C${sx + dir * dx * 0.5},${sy} ${ex - dir * dx * 0.5},${ey} ${ex},${ey}`;
  }
  const sx = scx, sy = s.y + ss.h, ex = tcx, ey = t.y, dy = Math.abs(ey - sy) || 1;
  return `M${sx},${sy} C${sx},${sy + dy * 0.5} ${ex},${ey - dy * 0.5} ${ex},${ey}`;
}

/* ---- status toggle on a node ---- */
function StatusToggle({ node }) {
  const s = STATUS[node.status];
  return (
    <button className="wf-toggle nodrag" title={s.label} onClick={(e) => { e.stopPropagation(); actions.cycleStatus(node.id); }}>
      {node.status === "completed"
        ? <span style={{ color: s.color, display: "grid", placeItems: "center" }}><Icon.check /></span>
        : <StatusDot status={node.status} size={11} />}
    </button>
  );
}

/* ---- branch creator popover ---- */
function BranchPopover({ parent }) {
  const [title, setTitle] = useV("");
  const [type, setType] = useV("primary");
  const can = title.trim().length > 0;
  return (
    <div className="wf-branchpop nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <div className="t-xs" style={{ fontWeight: 600, marginBottom: 8 }}>Branch from “{parent.title}”</div>
      <input className="pf-input" style={{ padding: "8px 10px", fontSize: 13 }} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New topic title" onKeyDown={(e) => e.key === "Enter" && can && actions.addBranch(parent.id, title.trim(), type)} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <select className="pf-select" style={{ padding: "8px 10px", fontSize: 13, flex: 1 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
        </select>
        <button className="pf-btn pf-btn--ghost pf-btn--sm" onClick={() => actions.openBranch(parent.id)}>Cancel</button>
        <button className="pf-btn pf-btn--primary pf-btn--sm" disabled={!can} style={!can ? { opacity: .5 } : null} onClick={() => actions.addBranch(parent.id, title.trim(), type)}>Add</button>
      </div>
    </div>
  );
}

/* ---- a single node ---- */
function FlowNode({ node }) {
  const selectedId = useStore((s) => s.selectedId);
  const branchingId = useStore((s) => s.branchingId);
  const size = NODE_SIZE[node.type];
  const isSel = selectedId === node.id;
  const isSection = node.type === "section_header";
  const isSecondary = node.type === "secondary";
  const tint = isSection ? null : nodeTint(node.status);

  const style = { left: node.x, top: node.y, width: size.w, height: size.h };
  if (isSection) { style.background = "var(--section-surface)"; style.color = "var(--section-text)"; }
  else { style.background = tint.bg; style.borderColor = tint.b; }
  if (node.status === "skipped" && !isSection) style.opacity = 0.78;

  const cls = ["wf-node", "wf-node--" + node.type, isSel ? "is-sel" : "", isSecondary ? "is-dashed" : ""].join(" ");

  return (
    <div className={cls} style={style} onClick={(e) => { e.stopPropagation(); actions.selectNode(node.id); }}>
      {isSection
        ? <span className="wf-node-title section">{node.title}</span>
        : <span className="wf-node-title">{node.title}</span>}
      {!isSection && <StatusToggle node={node} />}

      {branchingId === null && (
        <button className="wf-branch nodrag" title="Add a branch" onClick={(e) => { e.stopPropagation(); actions.openBranch(node.id); }}><Icon.plus width="12" height="12" /></button>
      )}
      {branchingId === node.id && <BranchPopover parent={node} />}
    </div>
  );
}

/* ---- the pannable canvas ---- */
function Canvas() {
  const roadmap = useStore((s) => s.roadmap);
  const { nodes, edges } = roadmap;
  const wrapRef = useVR(null);
  const [view, setView] = useV({ tx: 40, ty: 24, scale: 0.82 });
  const drag = useVR(null);

  const bounds = React.useMemo(() => {
    let maxX = 600, maxY = 400, minX = 0;
    nodes.forEach((n) => { const s = NODE_SIZE[n.type]; maxX = Math.max(maxX, n.x + s.w); maxY = Math.max(maxY, n.y + s.h); minX = Math.min(minX, n.x); });
    return { w: maxX + 60, h: maxY + 60, minX };
  }, [nodes]);

  const center = useVC(() => {
    const el = wrapRef.current; if (!el) return;
    const cw = el.clientWidth;
    const scale = 0.82;
    const tx = Math.max(24, (cw - bounds.w * scale) / 2);
    setView({ tx, ty: 24, scale });
  }, [bounds.w]);

  useVE(() => { center(); }, [center]);

  const onDown = (e) => {
    if (e.target.closest(".wf-node") || e.target.closest(".wf-branchpop")) return;
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    actions.selectNode(null);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setView((v) => ({ ...v, tx: drag.current.tx + (e.clientX - drag.current.x), ty: drag.current.ty + (e.clientY - drag.current.y) }));
  };
  const onUp = () => { drag.current = null; };
  const onWheel = (e) => { setView((v) => ({ ...v, ty: v.ty - e.deltaY, tx: v.tx - e.deltaX })); };
  const zoom = (d) => setView((v) => ({ ...v, scale: Math.min(1.4, Math.max(0.4, +(v.scale + d).toFixed(2))) }));

  return (
    <div className="wf-canvas" ref={wrapRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel}>
      <div className="wf-canvas-inner" style={{ width: bounds.w, height: bounds.h, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` }}>
        <svg className="wf-edges" width={bounds.w} height={bounds.h}>
          {edges.map((e) => {
            const s = nodes.find((n) => n.id === e.source), t = nodes.find((n) => n.id === e.target);
            if (!s || !t) return null;
            const opt = e.type === "optional";
            return <path key={e.id} d={edgePath(s, t)} fill="none" stroke={opt ? "var(--edge-optional)" : "var(--edge-required)"} strokeWidth={opt ? 1.4 : 1.7} strokeDasharray={opt ? "5 6" : "none"} strokeLinecap="round" />;
          })}
        </svg>
        {nodes.map((n) => <FlowNode key={n.id} node={n} />)}
      </div>

      <div className="wf-controls">
        <button className="wf-ctrl" onClick={() => zoom(0.1)} title="Zoom in"><Icon.zoomIn /></button>
        <button className="wf-ctrl" onClick={() => zoom(-0.1)} title="Zoom out"><Icon.zoomOut /></button>
        <button className="wf-ctrl" onClick={center} title="Fit view"><Icon.fit /></button>
      </div>
    </div>
  );
}

/* ---- legend popover ---- */
function Legend() {
  const [open, setOpen] = useV(false);
  const ref = useVR(null);
  useVE(() => {
    if (!open) return;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="pf-btn pf-btn--secondary pf-btn--sm" style={{ height: 38 }} onClick={() => setOpen((v) => !v)}><Icon.grid /> Legend</button>
      {open && (
        <div className="wf-legend">
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Status</div>
          {Object.keys(STATUS).map((k) => (
            <div key={k} className="wf-legend-row"><StatusDot status={k} /><span className="t-sm">{STATUS[k].label}</span></div>
          ))}
          <hr className="pf-divider" style={{ margin: "12px 0" }} />
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Connections</div>
          <div className="wf-legend-row"><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--edge-required)" strokeWidth="2" /></svg><span className="t-sm">Required</span></div>
          <div className="wf-legend-row"><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--edge-optional)" strokeWidth="2" strokeDasharray="4 4" /></svg><span className="t-sm">Optional</span></div>
        </div>
      )}
    </div>
  );
}

/* ---- save button ---- */
function SaveButton() {
  const state = useStore((s) => s.savedState);
  const map = {
    unsaved: { label: "Save roadmap", cls: "pf-btn--primary" },
    dirty:   { label: "Save changes", cls: "pf-btn--primary" },
    saving:  { label: "Saving…", cls: "pf-btn--primary" },
    saved:   { label: "Saved", cls: "pf-btn--secondary" },
  };
  const b = map[state];
  return (
    <button className={"pf-btn " + b.cls} style={{ height: 38, ...(state === "saving" ? { opacity: .75 } : {}) }} disabled={state === "saving" || state === "saved"} onClick={actions.save}>
      {state === "saved" && <Icon.check />}{b.label}
    </button>
  );
}

/* ---- viewer header ---- */
function ViewerHeader() {
  const roadmap = useStore((s) => s.roadmap);
  const user = useStore((s) => s.user);
  const [editing, setEditing] = useV(false);
  const [draft, setDraft] = useV("");
  const start = () => { setDraft(roadmap.title); setEditing(true); };
  const commit = () => { setEditing(false); if (draft.trim()) actions.renameRoadmap(draft.trim()); };
  return (
    <header className="wf-vh">
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <button className="pf-btn pf-btn--secondary pf-btn--sm" style={{ height: 38 }} onClick={() => actions.setView("home")}><Icon.plus /> New roadmap</button>
        <div style={{ minWidth: 0 }}>
          {editing
            ? <input className="pf-input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, padding: "4px 10px", maxWidth: 420 }} />
            : <button className="wf-title-btn" onClick={start} title="Rename roadmap">
                <h1 className="t-h3" style={{ fontSize: 21 }}>{roadmap.title}</h1>
                <span className="wf-title-pencil"><Icon.pencil /></span>
              </button>}
          <p className="t-sm text-3" style={{ marginTop: 2 }}>{roadmap.topic || "Manual roadmap"}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user ? <SaveButton /> : <button className="pf-btn pf-btn--secondary pf-btn--sm" style={{ height: 38 }} onClick={() => actions.setView("login")}>Sign in to save</button>}
        <Legend />
        <ThemeToggle size={38} />
        <AppMenu />
      </div>
    </header>
  );
}

/* ---- detail panel (360px) ---- */
const RES_TYPES = ["article", "video", "course", "docs"];
function DetailPanel() {
  const node = useStore((s) => s.roadmap.nodes.find((n) => n.id === s.selectedId));
  const [draft, setDraft] = useV({ label: "", url: "", type: "article" });
  if (!node) return null;
  const addRes = () => { if (!draft.label.trim() || !draft.url.trim()) return; actions.addResource(node.id, draft); setDraft({ label: "", url: "", type: "article" }); };
  return (
    <aside className="wf-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="t-eyebrow">Edit node</span>
        <button className="wf-icon-ghost" onClick={() => actions.selectNode(null)} aria-label="Close"><Icon.close /></button>
      </div>

      <PanelField label="Type">
        <select className="pf-select" value={node.type} onChange={(e) => actions.updateNode(node.id, { type: e.target.value })}>
          <option value="section_header">Section header</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
        </select>
      </PanelField>

      <PanelField label="Title">
        <textarea className="pf-textarea" rows={2} value={node.title} onChange={(e) => actions.updateNode(node.id, { title: e.target.value })} />
      </PanelField>

      <PanelField label="Status">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.keys(STATUS).map((k) => (
            <div key={k} className="pf-seg-item" data-active={node.status === k} style={{ gap: 7, fontSize: 12.5, padding: "9px 8px" }} onClick={() => actions.updateNode(node.id, { status: k })}>
              <StatusDot status={k} /> {STATUS[k].label}
            </div>
          ))}
        </div>
      </PanelField>

      <PanelField label="Description">
        <textarea className="pf-textarea" rows={5} value={node.description} onChange={(e) => actions.updateNode(node.id, { description: e.target.value })} placeholder="Add a description (Markdown supported)…" />
      </PanelField>

      <div className="wf-field">
        <label className="pf-label">Resources</label>
        {node.resources.length === 0 && <p className="t-xs text-3" style={{ marginBottom: 8 }}>No resources yet.</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {node.resources.map((r, i) => (
            <div key={i} className="wf-res">
              <span className="wf-res-type">{r.type}</span>
              <a href={r.url} target="_blank" rel="noreferrer" className="t-sm" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</a>
              <button className="wf-icon-ghost" onClick={() => actions.removeResource(node.id, i)} aria-label="Remove"><Icon.close /></button>
            </div>
          ))}
        </div>
        <div className="wf-res-add">
          <input className="pf-input" style={{ padding: "8px 10px", fontSize: 13 }} placeholder="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input className="pf-input" style={{ padding: "8px 10px", fontSize: 13 }} placeholder="https://…" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <select className="pf-select" style={{ padding: "8px 10px", fontSize: 13, flex: 1 }} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              {RES_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="pf-btn pf-btn--secondary pf-btn--sm" onClick={addRes}><Icon.plus /> Add</button>
          </div>
        </div>
      </div>

      <button className="pf-btn pf-btn--danger pf-btn--block" style={{ marginTop: "auto" }} onClick={() => actions.deleteNode(node.id)}><Icon.trash /> Delete node</button>
    </aside>
  );
}
function PanelField({ label, children }) {
  return <div className="wf-field"><label className="pf-label">{label}</label>{children}</div>;
}

/* ---- empty editor state ---- */
function EmptyEditor() {
  return (
    <div className="wf-empty">
      <div className="wf-empty-card">
        <div className="wf-empty-plus"><Icon.plus width="26" height="26" /></div>
        <h2 className="t-h2" style={{ marginTop: 22 }}>Build your roadmap</h2>
        <p className="t-lg text-2" style={{ marginTop: 10, maxWidth: 420 }}>Your canvas is empty. Add your first node, then connect and branch from it to shape your path.</p>
        <button className="pf-btn pf-btn--primary pf-btn--lg" style={{ marginTop: 22 }} onClick={actions.addFirstNode}><Icon.plus /> Add your first node</button>
        <div className="wf-empty-hints">
          <Hint icon={<Icon.plus />} t="Add nodes" d="Topics, sections, and optional side-quests." />
          <Hint icon={<Icon.link />} t="Branch & connect" d="Hover a node and press + to branch." />
          <Hint icon={<Icon.check />} t="Track status" d="Mark steps as you progress." />
        </div>
      </div>
    </div>
  );
}
function Hint({ icon, t, d }) {
  return (
    <div className="wf-hint">
      <span className="wf-hint-ic">{icon}</span>
      <div><div className="t-sm" style={{ fontWeight: 600 }}>{t}</div><div className="t-xs text-3" style={{ marginTop: 2 }}>{d}</div></div>
    </div>
  );
}

/* ---- viewer screen ---- */
function Viewer() {
  const empty = useStore((s) => s.roadmap.nodes.length === 0);
  const hasSel = useStore((s) => s.selectedId !== null);
  return (
    <div className="wf-viewer">
      <ViewerHeader />
      <div className="wf-viewer-body">
        {empty ? <EmptyEditor /> : <Canvas />}
        {!empty && hasSel && <DetailPanel />}
      </div>
    </div>
  );
}

Object.assign(window, { Viewer });
