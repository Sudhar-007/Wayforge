import { useState, useRef, useEffect, useCallback } from 'react';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hey, I'm Pathfinder. I'll ask you 5 quick questions and build a learning roadmap tailored exactly to you. What's your end goal — are you trying to land a job, build something specific, do research, or just explore?"
};

// Status cycle: unmarked → done → skip → unmarked
const NEXT_STATUS = { undefined: 'done', done: 'skip', skip: undefined };

// ── Individual node card ──────────────────────────────────────────────────────
function NodeCard({ node, status, onStatus, onOpen, isSelected }) {
  return (
    <div
      className={`rm-node ${node.type} st-${status || 'none'} ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onOpen(node)}
      title={node.description}
    >
      <span className="rm-node-icon">{node.type === 'project' ? '🔨' : '📖'}</span>
      <span className="rm-node-label">{node.label}</span>
      <button
        className={`rm-status-btn st-${status || 'none'}`}
        onClick={e => { e.stopPropagation(); onStatus(node.id); }}
        title={status ? `${status} — click to change` : 'Mark done'}
        aria-label="toggle status"
      >
        {status === 'done' ? '✓' : status === 'skip' ? '−' : '○'}
      </button>
    </div>
  );
}

// ── SVG lines converging from resources to project ────────────────────────────
// Uses preserveAspectRatio="none" so coordinates are always proportional
function BranchLines({ count }) {
  // viewBox x positions for each resource count
  const pts = {
    1: [[50]],
    2: [[25, 75]],
    3: [[15, 50, 85]],
  }[count] || [[50]];
  const xs = pts[0];
  return (
    <svg className="rm-branch-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
      {xs.map((x, i) => (
        <line key={i} x1={x} y1="0" x2="50" y2="28"
          stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      ))}
    </svg>
  );
}

// ── SVG line expanding from project back to next phase ────────────────────────
function ExpandLines({ count }) {
  const pts = { 1: [[50]], 2: [[25, 75]], 3: [[15, 50, 85]] }[count] || [[50]];
  const xs = pts[0];
  return (
    <svg className="rm-branch-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
      {xs.map((x, i) => (
        <line key={i} x1="50" y1="0" x2={x} y2="28"
          stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      ))}
    </svg>
  );
}

// ── One phase block ───────────────────────────────────────────────────────────
function PhaseBlock({ phase, statuses, onStatus, onOpen, selectedId, isLast }) {
  const resources = phase.nodes.filter(n => n.type === 'resource');
  const projects  = phase.nodes.filter(n => n.type === 'project');
  const nextResCount = isLast ? 0 : 2; // hint for expand fan

  return (
    <div className="rm-phase">
      {/* ── Phase label row ── */}
      <div className="rm-phase-label">
        <span className="rm-rule" />
        <span className="rm-phase-title">
          {phase.emoji}&nbsp;<strong>{phase.name}</strong>
          <span className="rm-duration">{phase.duration}</span>
        </span>
        <span className="rm-rule" />
      </div>

      {/* ── Entry line ── */}
      <div className="rm-vline" />

      {/* ── Resource nodes (branching out) ── */}
      <div className={`rm-resource-row n${resources.length}`}>
        {resources.map(node => (
          <NodeCard key={node.id} node={node}
            status={statuses[node.id]} onStatus={onStatus}
            onOpen={onOpen} isSelected={selectedId === node.id} />
        ))}
      </div>

      {/* ── Converging lines to project ── */}
      {resources.length > 0 && projects.length > 0 && (
        <BranchLines count={resources.length} />
      )}

      {/* ── Project milestone ── */}
      {projects.map(node => (
        <div key={node.id} className="rm-milestone-row">
          <NodeCard node={node}
            status={statuses[node.id]} onStatus={onStatus}
            onOpen={onOpen} isSelected={selectedId === node.id} />
        </div>
      ))}

      {/* ── Expanding lines to next phase ── */}
      {!isLast && projects.length > 0 && (
        <ExpandLines count={2} />
      )}

      {!isLast && projects.length === 0 && <div className="rm-vline" />}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ roadmap, statuses }) {
  const all = roadmap.phases.flatMap(p => p.nodes);
  const done = all.filter(n => statuses[n.id] === 'done').length;
  const pct  = all.length ? Math.round((done / all.length) * 100) : 0;
  return (
    <div className="rm-progress">
      <div className="rm-progress-bar" style={{ width: `${pct}%` }} />
      <span className="rm-progress-label">{pct}% complete — {done}/{all.length} topics</span>
    </div>
  );
}

// ── Detail side panel ─────────────────────────────────────────────────────────
function DetailPanel({ node, status, onStatus, onClose }) {
  if (!node) return null;
  return (
    <div className="dp-panel" role="dialog" aria-modal="true">
      <button className="dp-close" onClick={onClose} aria-label="Close">✕</button>
      <div className={`dp-badge ${node.type}`}>
        {node.type === 'project' ? '🔨 Project' : '📖 Resource'}
      </div>
      <h3 className="dp-title">{node.label}</h3>
      <p className="dp-desc">{node.description}</p>

      <div className="dp-status-row">
        <span className="dp-status-label">Progress:</span>
        <button
          className={`dp-status-btn st-${status || 'none'}`}
          onClick={() => onStatus(node.id)}
        >
          {status === 'done' ? '✓ Done' : status === 'skip' ? '− Skip' : '○ Mark done'}
        </button>
      </div>

      <a href={node.url} target="_blank" rel="noopener noreferrer" className="dp-link">
        Open Resource →
      </a>
    </div>
  );
}

// ── Full roadmap view ─────────────────────────────────────────────────────────
function RoadmapView({ roadmap }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_statuses') || '{}'); }
    catch { return {}; }
  });

  const handleStatus = useCallback((nodeId) => {
    setStatuses(prev => {
      const next = { ...prev, [nodeId]: NEXT_STATUS[prev[nodeId]] };
      if (!next[nodeId]) delete next[nodeId];
      localStorage.setItem('pf_statuses', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleOpen = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  return (
    <div className="rm-view">
      {/* Goal */}
      <div className="rm-goal">🎯 <strong>{roadmap.goal}</strong></div>

      {/* Progress */}
      <ProgressBar roadmap={roadmap} statuses={statuses} />

      {/* Legend */}
      <div className="rm-legend">
        <span className="rm-legend-item resource">📖 Resource — click for detail</span>
        <span className="rm-legend-item project">🔨 Milestone — click for detail</span>
        <span className="rm-legend-item status">○ = mark done / skip</span>
      </div>

      {/* Flow */}
      <div className="rm-flow">
        {roadmap.phases.map((phase, i) => (
          <PhaseBlock
            key={phase.id}
            phase={phase}
            statuses={statuses}
            onStatus={handleStatus}
            onOpen={handleOpen}
            selectedId={selectedNode?.id}
            isLast={i === roadmap.phases.length - 1}
          />
        ))}
      </div>

      {/* Key insight */}
      {roadmap.keyConcept && (
        <div className="key-concept">💡 {roadmap.keyConcept}</div>
      )}

      {/* Detail panel */}
      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          status={statuses[selectedNode.id]}
          onStatus={handleStatus}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

// ── JSON parser ───────────────────────────────────────────────────────────────
function parseResponse(text) {
  if (!text.includes('ROADMAP_START') || !text.includes('ROADMAP_END')) {
    return { isRoadmap: false, intro: text };
  }
  const startIdx = text.indexOf('ROADMAP_START');
  const endIdx   = text.indexOf('ROADMAP_END');
  const intro    = text.substring(0, startIdx).trim();
  const jsonStr  = text.substring(startIdx + 13, endIdx).trim();
  try {
    return { isRoadmap: true, intro, roadmap: JSON.parse(jsonStr), rawData: text };
  } catch (e) {
    console.error('Roadmap JSON parse failed:', e);
    return { isRoadmap: false, intro: text };
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]           = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue]       = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [roadmapFinished, setRoadmapFinished] = useState(false);
  const [theme, setTheme]                 = useState('dark');
  const messagesEndRef = useRef(null);

  useEffect(() => { document.body.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMessage  = { role: 'user', content: inputValue };
    const newMessages  = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    try {
      const apiBase  = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Server error ${response.status}`);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.response.includes('ROADMAP_START')) setRoadmapFinished(true);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.message?.includes('fetch')
          ? 'Connection error — is the backend running on port 8000?'
          : (err.message || 'Something went wrong.')
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setRoadmapFinished(false);
    localStorage.removeItem('pf_statuses');
  };

  const handleDownload = (rawData) => {
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([rawData], { type: 'text/plain' }));
    a.download = 'Pathfinder_Roadmap.txt';
    a.click();
  };

  return (
    <div className="app-container">
      <div className="chat-header">
        <div className="brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          PATHFINDER
        </div>
        <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="chat-window">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const parsed = isUser ? { isRoadmap: false, intro: msg.content } : parseResponse(msg.content);
          return (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className={`avatar ${isUser ? 'me' : 'ai'}`}>{isUser ? 'ME' : 'AI'}</div>
              <div className="message-content" style={{ width: '100%' }}>
                {parsed.intro && <div className="message-bubble">{parsed.intro}</div>}
                {parsed.isRoadmap && (
                  <div className="roadmap-container">
                    <RoadmapView roadmap={parsed.roadmap} />
                    <div className="roadmap-actions">
                      <button className="action-btn" onClick={() => { navigator.clipboard.writeText(parsed.rawData); }}>📋 Copy</button>
                      <button className="action-btn" onClick={() => handleDownload(parsed.rawData)}>💾 Download</button>
                      <button className="action-btn" onClick={handleReset} style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>🔄 Start Over</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="message-row assistant">
            <div className="avatar ai">AI</div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="dot"/><div className="dot"/><div className="dot"/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!roadmapFinished && (
        <div className="input-area">
          <input
            type="text" value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isLoading) handleSend(); }}
            placeholder="Type your answer here..."
            disabled={isLoading} autoFocus
          />
          <button className="send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>Send</button>
        </div>
      )}
    </div>
  );
}
