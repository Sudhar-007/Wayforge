/* ============================================================================
   WAYFORGE — Intake, Loading, Login, Profile, My Roadmaps
   ========================================================================== */
const { useState: useStateF, useEffect: useEffectF } = React;

/* ---------------- Intake ---------------- */
function Intake() {
  const form = useStore((s) => s.form);
  const can = form.topic.trim() && form.goal.trim();
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const weeks = ["1-3 hours", "4-7 hours", "8-15 hours", "15+ hours"];
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wrap" style={{ maxWidth: 660, paddingTop: 56, paddingBottom: 80 }}>
        <span className="t-eyebrow">Create with AI · Step 1 of 1</span>
        <h1 className="t-h1" style={{ marginTop: 14 }}>Tell us about your learning goal</h1>
        <p className="t-lg text-2" style={{ marginTop: 12 }}>A few quick questions so Wayforge can shape a roadmap that actually fits you.</p>

        <form className="wf-form" onSubmit={(e) => { e.preventDefault(); if (can) actions.generate(); }}>
          <Field label="What do you want to learn?">
            <input className="pf-input" value={form.topic} onChange={(e) => actions.setForm({ topic: e.target.value })} placeholder="e.g. Machine Learning, Frontend Development, Cybersecurity" required />
          </Field>

          <Field label="What's your current level?">
            <div className="pf-seg" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {levels.map((lvl) => (
                <div key={lvl} className="pf-seg-item" data-active={form.level === lvl} onClick={() => actions.setForm({ level: lvl })}>{lvl}</div>
              ))}
            </div>
          </Field>

          <Field label="How much time can you dedicate weekly?">
            <div className="pf-seg" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {weeks.map((w) => (
                <div key={w} className="pf-seg-item" data-active={form.weekly === w} onClick={() => actions.setForm({ weekly: w })}>{w}</div>
              ))}
            </div>
          </Field>

          <Field label="What's your end goal?">
            <input className="pf-input" value={form.goal} onChange={(e) => actions.setForm({ goal: e.target.value })} placeholder="e.g. Get a job as an ML engineer, Build a side project" required />
          </Field>

          <Field label="Any specific topics to focus on?" hint="Optional">
            <textarea className="pf-textarea" rows={3} value={form.focus} onChange={(e) => actions.setForm({ focus: e.target.value })} placeholder="e.g. I already know Python and want to focus on deep learning frameworks" />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="submit" className="pf-btn pf-btn--primary pf-btn--lg" disabled={!can} style={!can ? { opacity: 0.5, cursor: "not-allowed" } : null}>Generate roadmap <Icon.arrow /></button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="wf-field">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <label className="pf-label" style={{ margin: 0 }}>{label}</label>
        {hint && <span className="pf-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ---------------- Loading ---------------- */
const LOADING_MSGS = ["Understanding your goals…", "Searching the best learning resources…", "Ranking content for your level…", "Building your personalized roadmap…"];
function Loading() {
  const [i, setI] = useStateF(0);
  useEffectF(() => { const t = setInterval(() => setI((n) => (n + 1) % LOADING_MSGS.length), 1400); return () => clearInterval(t); }, []);
  return (
    <div className="wf-center">
      <div className="wf-spinner" role="status" aria-label="Loading" />
      <p className="t-lg" style={{ marginTop: 26, fontWeight: 600 }} key={i}>{LOADING_MSGS[i]}</p>
      <p className="t-sm text-3" style={{ marginTop: 6 }}>This usually takes a few seconds.</p>
      <div className="wf-load-bar" style={{ marginTop: 28 }}><i /></div>
    </div>
  );
}

/* ---------------- Generation: error & no-results ---------------- */
function GenError() {
  const form = useStore((s) => s.form);
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wf-center" style={{ minHeight: "calc(100vh - 64px)", paddingTop: 0 }}>
        <div className="wf-state">
          <div className="wf-state-ic wf-state-ic--err" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="t-h2" style={{ marginTop: 22 }}>Generation failed</h1>
          <p className="t-lg text-2" style={{ marginTop: 10, maxWidth: 420 }}>Something went wrong while building your roadmap{form.topic ? <> for “<b style={{ color: "var(--text)" }}>{form.topic}</b>”</> : ""}. Your answers are saved — give it another try.</p>
          <div className="wf-state-err-note">
            <span className="wf-res-type" style={{ color: "#d64545", background: "rgba(214,69,69,.1)", borderColor: "rgba(214,69,69,.25)" }}>Error</span>
            <span className="t-sm text-2">The generation service didn't respond. This is usually temporary.</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="pf-btn pf-btn--ghost" onClick={() => actions.setView("intake")}>Edit answers</button>
            <button className="pf-btn pf-btn--primary" onClick={actions.generate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>
              Try again
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function NoResults() {
  const form = useStore((s) => s.form);
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wf-center" style={{ minHeight: "calc(100vh - 64px)", paddingTop: 0 }}>
        <div className="wf-state">
          <div className="wf-state-ic" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/><path d="M8.5 11h5"/></svg>
          </div>
          <h1 className="t-h2" style={{ marginTop: 22 }}>Not enough to go on</h1>
          <p className="t-lg text-2" style={{ marginTop: 10, maxWidth: 440 }}>We couldn't find solid learning resources for{form.topic ? <> “<b style={{ color: "var(--text)" }}>{form.topic}</b>”</> : " that topic"}. Try a broader or more common topic, or adjust your goal and level.</p>
          <div className="wf-suggest">
            <span className="t-xs text-3" style={{ alignSelf: "center" }}>Try instead</span>
            {["Frontend Development", "Machine Learning", "DevOps", "Cybersecurity"].map((t) => (
              <button key={t} className="wf-chip" onClick={() => { actions.setForm({ topic: t }); actions.generate(); }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="pf-btn pf-btn--ghost" onClick={() => actions.openModal("manual")}>Build manually instead</button>
            <button className="pf-btn pf-btn--primary" onClick={() => actions.setView("intake")}>Adjust answers <Icon.arrow /></button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Login ---------------- */
function Login() {
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wf-center" style={{ minHeight: "calc(100vh - 64px)", paddingTop: 0 }}>
        <div className="pf-card" style={{ width: "100%", maxWidth: 432, padding: 36 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span className="pf-pill"><span className="dot" />Welcome to Wayforge</span>
          </div>
          <h1 className="t-h2" style={{ textAlign: "center", marginTop: 18 }}>Sign in to continue</h1>
          <p className="t-sm text-2" style={{ textAlign: "center", marginTop: 8 }}>Choose your preferred sign-in method below.</p>

          <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
            <button className="wf-oauth" disabled title="Coming soon"><Icon.google /> Continue with Google <span className="wf-soon">soon</span></button>
            <button className="wf-oauth primary" onClick={actions.signIn}><Icon.github /> Continue with GitHub</button>
            <button className="wf-oauth" disabled title="Coming soon" style={{ opacity: .6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z"/></svg>
              Continue with LinkedIn <span className="wf-soon">soon</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
            <span className="t-xs text-3">Secure authentication</span>
            <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
          </div>
          <p className="t-xs text-3" style={{ textAlign: "center", lineHeight: 1.6 }}>We only use your profile to identify you. We never post on your behalf and never share your data.</p>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Profile ---------------- */
function Profile() {
  const user = useStore((s) => s.user);
  const saved = useStore((s) => s.saved);
  if (!user) return null;
  const avg = saved.length ? Math.round(saved.reduce((a, r) => a + r.progress, 0) / saved.length) : 0;
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wf-center" style={{ minHeight: "calc(100vh - 64px)", paddingTop: 0 }}>
        <div className="pf-card" style={{ width: "100%", maxWidth: 420, padding: 36, textAlign: "center" }}>
          <img src={user.avatar_url} alt="" style={{ width: 88, height: 88, borderRadius: "50%", border: "1px solid var(--border)", margin: "0 auto" }} />
          <h1 className="t-h2" style={{ marginTop: 18 }}>{user.github_username}</h1>
          <p className="t-sm text-2" style={{ marginTop: 4 }}>{user.email}</p>
          <div className="pf-pill" style={{ marginTop: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
            <Icon.github width="13" height="13" /> Connected to GitHub
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Stat n={String(saved.length)} l="Roadmaps" />
            <Stat n={avg + "%"} l="Avg. progress" />
          </div>
          <button className="pf-btn pf-btn--danger pf-btn--block" style={{ marginTop: 24 }} onClick={actions.signOut}>Sign out</button>
        </div>
      </main>
    </div>
  );
}
function Stat({ n, l }) {
  return (
    <div className="pf-card" style={{ padding: "14px 12px", boxShadow: "none", background: "var(--surface-2)" }}>
      <div className="t-h3" style={{ fontFamily: "var(--font-display)" }}>{n}</div>
      <div className="t-xs text-3" style={{ marginTop: 2 }}>{l}</div>
    </div>
  );
}

/* ---------------- My Roadmaps ---------------- */
function MyRoadmaps() {
  const saved = useStore((s) => s.saved);
  return (
    <div>
      <TopBar onBack={() => actions.setView("home")} backLabel="Home" />
      <main className="wrap" style={{ maxWidth: 1000, paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="t-h1">My roadmaps</h1>
            <p className="t-lg text-2" style={{ marginTop: 10 }}>Pick up where you left off, or start a new path.</p>
          </div>
          <button className="pf-btn pf-btn--primary" onClick={() => actions.setView("home")}><Icon.plus /> New roadmap</button>
        </div>

        <div className="wf-rm-grid">
          {saved.map((r) => <RoadmapCard key={r.id} item={r} />)}
        </div>
      </main>
    </div>
  );
}

function RoadmapCard({ item }) {
  const [hover, setHover] = useStateF(false);
  return (
    <div className="pf-card pf-card--hover wf-rm-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <h3 className="t-h3" style={{ fontFamily: "var(--font-text)", fontWeight: 700, fontSize: 16 }}>{item.title}</h3>
        <button className="wf-icon-ghost" style={{ opacity: hover ? 1 : 0 }} title="Rename"><Icon.pencil /></button>
      </div>
      <p className="t-sm text-2" style={{ marginTop: 4 }}>{item.topic} · {item.level}</p>
      <p className="t-xs text-3" style={{ marginTop: 2 }}>Created {item.created}</p>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }} className="t-xs text-2">
          <span>Progress</span><span style={{ fontFamily: "var(--font-mono)" }}>{item.progress}%</span>
        </div>
        <div className="pf-progress" style={{ marginTop: 7 }}><i style={{ width: item.progress + "%" }} /></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button className="pf-btn pf-btn--primary" style={{ flex: 1 }} onClick={() => actions.openSaved(item.id)}>{item.progress > 0 ? "Continue" : "Open"}</button>
        <button className="pf-btn pf-btn--danger pf-iconbtn" style={{ width: 40, padding: 0 }} title="Delete"><Icon.trash /></button>
      </div>
    </div>
  );
}

Object.assign(window, { Intake, Loading, GenError, NoResults, Login, Profile, MyRoadmaps });
