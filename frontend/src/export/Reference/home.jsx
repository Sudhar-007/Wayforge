/* ============================================================================
   WAYFORGE — Home, nav chrome, manual-create modal
   ========================================================================== */
const { useState: useStateH, useEffect: useEffectH, useRef: useRefH } = React;

function ThemeToggle({ size = 36 }) {
  const theme = useStore((s) => s.theme);
  return (
    <button className="pf-iconbtn" style={{ width: size, height: size }} onClick={actions.toggleTheme} title="Toggle theme" aria-label="Toggle theme">
      {theme === "light" ? <Icon.moon /> : <Icon.sun />}
    </button>
  );
}

function AppMenu() {
  const user = useStore((s) => s.user);
  const [open, setOpen] = useStateH(false);
  const ref = useRefH(null);
  useEffectH(() => {
    if (!open) return;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", f); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", f); document.removeEventListener("keydown", k); };
  }, [open]);
  if (!user) return (
    <button className="pf-btn pf-btn--secondary pf-btn--sm" style={{ height: 36 }} onClick={() => actions.setView("login")}>Sign in</button>
  );
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="wf-avatar-btn" onClick={() => setOpen((v) => !v)} aria-label="Account menu">
        <img className="avatar" src={user.avatar_url} alt="" />
      </button>
      {open && (
        <div className="wf-menu" role="menu">
          <div style={{ padding: "10px 12px" }}>
            <div className="t-sm" style={{ fontWeight: 600 }}>{user.github_username}</div>
            <div className="t-xs text-3" style={{ marginTop: 2 }}>{user.email}</div>
          </div>
          <hr className="pf-divider" />
          <button className="wf-menu-item" onClick={() => { setOpen(false); actions.setView("profile"); }}>My profile</button>
          <button className="wf-menu-item" onClick={() => { setOpen(false); actions.setView("myRoadmaps"); }}>My roadmaps</button>
          <hr className="pf-divider" />
          <button className="wf-menu-item danger" onClick={() => { setOpen(false); actions.signOut(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}>
      <span className="brand-mark"><Icon.logo /></span>
      <span className="brand-name">Wayforge</span>
    </button>
  );
}

/* Marketing nav (home) */
function Nav() {
  return (
    <div className="nav">
      <div className="wrap nav-inner">
        <Brand onClick={() => actions.setView("home")} />
        <div className="nav-actions">
          <button className="pf-btn pf-btn--ghost pf-btn--sm" style={{ height: 36 }} onClick={() => actions.setView("myRoadmaps")}>My roadmaps</button>
          <ThemeToggle />
          <AppMenu />
        </div>
      </div>
    </div>
  );
}

/* Internal top bar (intake / lists / profile) */
function TopBar({ onBack, backLabel = "Back" }) {
  return (
    <div className="nav">
      <div className="wrap nav-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {onBack && <button className="wf-back" onClick={onBack}><Icon.back /> {backLabel}</button>}
          <Brand onClick={() => actions.setView("home")} />
        </div>
        <div className="nav-actions"><ThemeToggle /><AppMenu /></div>
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
function Home() {
  return (
    <div>
      <Nav />
      <main>
        <section className="wrap hero">
          <div className="pf-pill" style={{ display: "inline-flex" }}><span className="dot" />AI-powered learning paths</div>
          <h1 className="t-display">Learn anything, in the right order.</h1>
          <p className="sub">Tell Wayforge your goal, level, and weekly time. We map it into a structured, resource-backed roadmap — or build your own, node by node.</p>

          <div className="paths">
            <div className="pf-card pf-card--hover path-card" onClick={() => actions.setView("intake")}>
              <span className="glow" style={{ background: "radial-gradient(420px 180px at 30% -10%, var(--accent-soft), transparent)" }} />
              <div className="reco"><span className="reco-tag">Recommended</span></div>
              <div className="path-icon ai"><Icon.spark /></div>
              <h3>Create with AI</h3>
              <p>Answer a few quick questions. We'll generate a structured roadmap with the right resources, in the right order.</p>
              <span className="path-cta ai">Start with AI <Icon.arrow /></span>
            </div>

            <div className="pf-card pf-card--hover path-card" onClick={() => actions.openModal("manual")}>
              <span className="glow" style={{ background: "radial-gradient(420px 180px at 30% -10%, var(--surface-3), transparent)" }} />
              <div className="path-icon manual"><Icon.penPlus /></div>
              <h3>Create manually</h3>
              <p>Start from a blank canvas and build your own roadmap, adding and branching nodes exactly how you want.</p>
              <span className="path-cta manual">Build my own <Icon.arrow /></span>
            </div>
          </div>

          <section className="features">
            <Feature icon={<Icon.target />} title="Personalized" body="Built around your goal, level, and weekly time budget — not a generic syllabus." />
            <Feature icon={<Icon.route />} title="Structured" body="Curated steps and resources, ordered for the fastest path to real progress." />
            <Feature icon={<Icon.edit />} title="Editable" body="Tweak, reorder, branch, or skip steps. Your roadmap adapts as you learn." />
          </section>
        </section>

        <footer className="foot">
          <div className="wrap foot-inner">
            <span>Built for self-directed learners</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>wayforge.page</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="pf-card pf-card--hover feature">
      <div className="feature-ic">{icon}</div>
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  );
}

/* ---------------- Manual-create modal ---------------- */
function ManualModal() {
  const [title, setTitle] = useStateH("");
  const can = title.trim().length > 0;
  useEffectH(() => {
    const f = (e) => e.key === "Escape" && actions.closeModal();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  const submit = () => { if (can) actions.createManual(title.trim()); };
  return (
    <div className="scrim" onMouseDown={actions.closeModal}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-ic"><Icon.penPlus /></div>
        <h2 className="t-h3" style={{ marginTop: 16 }}>Name your roadmap</h2>
        <p className="t-sm text-2" style={{ marginTop: 8 }}>Give it a title to start — you'll build the nodes yourself on a blank canvas. You can rename it anytime.</p>
        <div style={{ marginTop: 20 }}>
          <label className="pf-label" htmlFor="rmtitle">Roadmap title</label>
          <input id="rmtitle" className="pf-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="e.g. My Rust learning path" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="pf-btn pf-btn--ghost" onClick={actions.closeModal}>Cancel</button>
          <button className="pf-btn pf-btn--primary" disabled={!can} style={!can ? { opacity: 0.5, cursor: "not-allowed" } : null} onClick={submit}>Create roadmap <Icon.arrow /></button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Home, ManualModal, Nav, TopBar, AppMenu, ThemeToggle, Brand });
