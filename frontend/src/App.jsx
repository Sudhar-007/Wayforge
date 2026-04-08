import { useState, useRef, useEffect } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid outside the component lifecycle
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hey, I'm Pathfinder. I'll ask you 5 quick questions and build a learning roadmap tailored exactly to you. What's your end goal — are you trying to land a job, build something specific, do research, or just explore?"
};

// Component to handle async Mermaid rendering safely
function MermaidDiagram({ chartCode }) {
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    const renderChart = async () => {
      if (!chartCode) return;
      try {
        // Generate a unique ID to prevent collisions if the user resets and generates again
        const id = `roadmap-diagram-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chartCode);
        setSvgContent(svg);
      } catch (error) {
        console.error('Failed to render Mermaid diagram:', error);
        setSvgContent('<div style="color: #ff7b72;">Error generating diagram. Check console for details.</div>');
      }
    };

    renderChart();
  }, [chartCode]);

  return (
    <div
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapFinished, setRoadmapFinished] = useState(false);
  const [theme, setTheme] = useState('dark');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Updated Parser for MERMAID tags
  const parseRoadmapText = (text) => {
    if (!text.includes('ROADMAP_START') || !text.includes('ROADMAP_END')) {
      return { isRoadmap: false, intro: text };
    }

    const startIdx = text.indexOf('ROADMAP_START');
    const intro = text.substring(0, startIdx).trim();

    // Extract Mermaid code
    const mermaidStart = text.indexOf('MERMAID_START');
    const mermaidEnd = text.indexOf('MERMAID_END');
    let mermaidCode = '';

    if (mermaidStart !== -1 && mermaidEnd !== -1) {
      mermaidCode = text.substring(mermaidStart + 13, mermaidEnd).trim();
    }

    // Extract Key Concept
    const conceptMatch = text.match(/KEY_CONCEPT:([\s\S]*?)ROADMAP_END/);
    const keyConcept = conceptMatch ? conceptMatch[1].trim() : '';

    return { isRoadmap: true, intro, mermaidCode, keyConcept, rawData: text };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Network response failed');

      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.response };

      setMessages(prev => [...prev, botMessage]);

      if (data.response.includes('ROADMAP_START')) {
        setRoadmapFinished(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Ensure backend is running on port 8000.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && !roadmapFinished) handleSend();
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setRoadmapFinished(false);
  };

  const handleCopy = (rawData) => {
    navigator.clipboard.writeText(rawData);
    alert('Raw roadmap logic copied to clipboard!');
  };

  const handleDownload = (rawData) => {
    const blob = new Blob([rawData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ML_Roadmap_Pathfinder.txt';
    a.click();
    URL.revokeObjectURL(url);
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
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="chat-window">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const parsed = isUser ? { isRoadmap: false, intro: msg.content } : parseRoadmapText(msg.content);

          return (
            <div key={index} className={`message-row ${msg.role}`}>
              <div className={`avatar ${isUser ? 'me' : 'ai'}`}>
                {isUser ? 'ME' : 'AI'}
              </div>

              <div className="message-content" style={{ width: '100%' }}>
                {parsed.intro && (
                  <div className="message-bubble">{parsed.intro}</div>
                )}

                {parsed.isRoadmap && (
                  <div className="roadmap-container">

                    {/* Render the Mermaid Diagram */}
                    {parsed.mermaidCode && (
                      <MermaidDiagram chartCode={parsed.mermaidCode} />
                    )}

                    {parsed.keyConcept && (
                      <div className="key-concept">
                        💡 {parsed.keyConcept}
                      </div>
                    )}

                    <div className="roadmap-actions">
                      <button className="action-btn" onClick={() => handleCopy(parsed.rawData)}>
                        📋 Copy Raw Text
                      </button>
                      <button className="action-btn" onClick={() => handleDownload(parsed.rawData)}>
                        💾 Download .txt
                      </button>
                      <button className="action-btn" onClick={handleReset} style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                        🔄 Start Over
                      </button>
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
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!roadmapFinished && (
        <div className="input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            disabled={isLoading}
            autoFocus
          />
          <button className="send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}