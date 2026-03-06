import { useState, useRef } from "react";
import { useTracerStore } from "../store/useTracerStore";
import { useProxyStore }  from "../store/useProxyStore";
import GraphCanvas   from "./tracer/GraphCanvas";
import PacketLog     from "./tracer/PacketLog";
import AIExplainPage from "./tracer/AIExplainPage";
import { RightPanel, StaticCompact } from "./tracer/DataPanels";

// ── Extension connect/disconnect toggle (mirrors ProxyStatusBanner style) ────
function ExtensionToggle({ extConnected, onDisconnect, onConnect, connecting }) {
  if (extConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "IBM Plex Mono", fontSize: 9, fontWeight: 700, color: "#10b981", background: "#10b98118", border: "1px solid #10b98144", borderRadius: 7, padding: "7px 12px", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
          ● Chrome Extension Connected ✓
        </span>
        <button
          onClick={onDisconnect}
          style={{
            background: "#ef444418", border: "1px solid #ef444444",
            borderRadius: 7, padding: "7px 14px",
            fontFamily: "IBM Plex Mono", fontSize: 9, fontWeight: 700,
            color: "#ef4444", cursor: "pointer",
            whiteSpace: "nowrap", transition: "all 0.2s", letterSpacing: "0.05em",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ef444430"; e.currentTarget.style.borderColor = "#ef444488"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#ef444418"; e.currentTarget.style.borderColor = "#ef444444"; }}
        >
          ✕ DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={connecting}
      style={{
        background: connecting ? "#60a5fa18" : "#10b98118",
        border: `1px solid ${connecting ? "#60a5fa44" : "#10b98144"}`,
        borderRadius: 7, padding: "7px 14px",
        fontFamily: "IBM Plex Mono", fontSize: 9, fontWeight: 700,
        color: connecting ? "#60a5fa" : "#10b981",
        cursor: connecting ? "not-allowed" : "pointer",
        whiteSpace: "nowrap", transition: "all 0.2s", letterSpacing: "0.05em",
        display: "flex", alignItems: "center", gap: 6,
      }}
      onMouseEnter={e => { if (!connecting) { e.currentTarget.style.background = "#10b98130"; e.currentTarget.style.borderColor = "#10b98188"; }}}
      onMouseLeave={e => { e.currentTarget.style.background = connecting ? "#60a5fa18" : "#10b98118"; e.currentTarget.style.borderColor = connecting ? "#60a5fa44" : "#10b98144"; }}
    >
      {connecting && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>}
      {connecting ? "CONNECTING..." : "CONNECT EXTENSION"}
    </button>
  );
}

function TabPicker({ tabs, domain, onSelect }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ background: "#0d1117", border: "1px solid #a855f744", borderRadius: 10, padding: "24px 28px", maxWidth: 460, width: "100%" }}>
        <div style={{ color: "#a855f7", fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1, marginBottom: 5 }}>SELECT TAB TO TRACE</div>
        <div style={{ color: "#6b7280", fontSize: 10, fontFamily: "IBM Plex Mono", marginBottom: 18 }}>
          {tabs.length} open tab(s) for <span style={{ color: "#e5e7eb" }}>{domain}</span>
        </div>
        {tabs.map(tab => (
          <button key={tab.tabId} onClick={() => onSelect(tab.tabId)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "#131920", border: "1px solid #1f2937", borderRadius: 6, padding: "10px 12px", marginBottom: 7, cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#a855f744"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1f2937"}>
            {tab.favicon && <img src={tab.favicon} style={{ width: 13, height: 13, flexShrink: 0 }} alt="" />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#e5e7eb", fontSize: 10, fontFamily: "IBM Plex Mono", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.title}</div>
              <div style={{ color: "#374151", fontSize: 8, fontFamily: "IBM Plex Mono", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.url}</div>
            </div>
            {tab.active && <span style={{ fontSize: 7, color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 2, padding: "1px 4px", flexShrink: 0 }}>ACTIVE</span>}
          </button>
        ))}
        <button onClick={() => onSelect(null)} style={{ width: "100%", background: "transparent", border: "1px solid #1f2937", borderRadius: 6, padding: "7px", color: "#4b5563", fontSize: 9, fontFamily: "IBM Plex Mono", cursor: "pointer", marginTop: 3 }}>
          Capture all tabs
        </button>
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange, canExplain }) {
  if (!canExplain) return null;
  const isAI = view === "ai";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#0d1117", border: "1px solid #1f2937", borderRadius: 7, padding: 3, fontFamily: "IBM Plex Mono" }}>
      <button onClick={() => onChange("graph")} style={{ padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer", background: !isAI ? "#1a1f2e" : "transparent", color: !isAI ? "#e5e7eb" : "#374151", fontSize: 8, fontWeight: 700, fontFamily: "IBM Plex Mono", transition: "all 0.15s", boxShadow: !isAI ? "0 1px 3px rgba(0,0,0,0.4)" : "none" }}>
        ◉ GRAPH
      </button>
      <button onClick={() => onChange("ai")} style={{ padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer", background: isAI ? "rgba(168,85,247,0.2)" : "transparent", color: isAI ? "#a855f7" : "#374151", fontSize: 8, fontWeight: 700, fontFamily: "IBM Plex Mono", transition: "all 0.15s", boxShadow: isAI ? "0 1px 3px rgba(168,85,247,0.2)" : "none" }}>
        ◈ AI EXPLAIN
      </button>
    </div>
  );
}

const APP_KEYWORDS = {
  tiktok:    ["tiktok.com"],
  instagram: ["instagram.com"],
  youtube:   ["youtube.com", "youtu.be", "googlevideo.com", "ytimg.com"],
  facebook:  ["facebook.com", "fb.com", "fbcdn.net"],
  twitter:   ["twitter.com", "x.com", "twimg.com"],
  netflix:   ["netflix.com", "nflxvideo.net"],
  discord:   ["discord.com", "discordapp.com"],
  reddit:    ["reddit.com", "redd.it"],
};

function domainIsBlocked(domain, rules, customBlocked) {
  if (!domain) return { blocked: false, matchedRule: null, ruleType: null };
  const d = domain.toLowerCase().replace(/^www\./, "");
  for (const [app, patterns] of Object.entries(APP_KEYWORDS)) {
    if (rules[app] && patterns.some(p => d === p || d.endsWith("." + p)))
      return { blocked: true, matchedRule: app, ruleType: "app" };
  }
  const matchedCustom = customBlocked.find(cd => {
    const rule = cd.toLowerCase();
    return d === rule || d.endsWith("." + rule) || d.startsWith(rule + ".");
  });
  if (matchedCustom) return { blocked: true, matchedRule: matchedCustom, ruleType: "custom" };
  if (rules[d] === true) return { blocked: true, matchedRule: d, ruleType: "custom" };
  return { blocked: false, matchedRule: null, ruleType: null };
}

export default function NetworkTracer() {
  const {
    domain, phase, staticData: sd, liveCapture: lc, error, openTabs,
    extConnected, elapsedSecs, runTrace, stopCapture, reset, selectTab, aiRaw, aiDone, setAICache,
  } = useTracerStore();

  const { rules, customBlocked } = useProxyStore(s => ({
    rules:         s.rules,
    customBlocked: s.customBlocked,
  }));

  const { blocked: isBlocked, matchedRule, ruleType } = domainIsBlocked(domain, rules, customBlocked);

  const [inputVal,    setInputVal]    = useState("");
  const [view,        setView]        = useState("graph");
  const [connecting,  setConnecting]  = useState(false);


  const isRunning  = phase === "static" || phase === "capturing";
  const hasContent = phase === "static" || phase === "capturing" || phase === "done";
  const canExplain = !!sd;

  const handleReset = () => {
    reset();
    setInputVal("");
    setView("graph");
    
    
  };

  // Disconnect: stop capture → reset to idle → mark disconnected
  const handleDisconnect = async () => {
    if (phase === "capturing") await stopCapture();
    handleReset();
    useTracerStore.setState({ extConnected: false });
  };

  // Connect: re-trigger extension discovery by pinging stored ID
  const handleConnect = async () => {
    setConnecting(true);
    // Re-check proxy store first (fastest path)
    const proxyId = useProxyStore.getState?.()?.extensionId;
    if (proxyId) {
      useTracerStore.setState({ extConnected: true });
      setConnecting(false);
      return;
    }
    // Try stored ID
    const stored = localStorage.getItem("dpi_ext_id");
    if (stored) {
      try {
        const alive = await new Promise(resolve => {
          try {
            chrome.runtime.sendMessage(stored, { type: "PING" }, res => {
              if (chrome.runtime.lastError || !res?.pong) resolve(false);
              else resolve(true);
            });
          } catch { resolve(false); }
        });
        if (alive) {
          useTracerStore.setState({ extConnected: true });
          setConnecting(false);
          return;
        }
      } catch {}
    }
    // Not found — briefly show failed state then reset
    setTimeout(() => setConnecting(false), 1500);
  };

  const extToggle = (
    <ExtensionToggle
      extConnected={extConnected}
      connecting={connecting}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );

  // AI view
  if (view === "ai" && sd) {
    return (
      <div style={{ fontFamily: "IBM Plex Mono", color: "#e5e7eb", minHeight: "100vh", background: "#080b10" }}>
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <span style={{ color: "#a855f7", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>◈ NETWORK TRACER</span>
              {aiDone
                ? <span style={{ fontSize: 9, color: "#10b981", padding: "2px 8px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 3 }}>✓ ANALYSIS COMPLETE</span>
                : <span style={{ fontSize: 9, color: "#374151" }}>AI ANALYSIS</span>
              }
              {isBlocked && (
                <span style={{ fontSize: 9, color: "#ef4444", padding: "2px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 3, fontWeight: 700 }}>
                  ⊗ BLOCKED BY DPI ENGINE
                </span>
              )}
            </div>
            <p style={{ color: "#374151", fontSize: 9, margin: 0 }}>10-step professor explanation · DNS · TCP · TLS · CDN · Backend · Streaming</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ViewToggle view="ai" onChange={setView} canExplain={canExplain} />
            {extToggle}
          </div>
        </div>
        <AIExplainPage
          sd={sd} lc={lc} domain={domain}
          initialRaw={aiRaw}
          initialDone={aiDone}
          onCacheUpdate={setAICache}
          onClose={() => setView("graph")}
          isBlocked={isBlocked}
          matchedRule={matchedRule}
          ruleType={ruleType}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px", fontFamily: "IBM Plex Mono", color: "#e5e7eb", minHeight: "100vh", background: "#080b10" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <span style={{ color: "#a855f7", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>◈ NETWORK TRACER</span>
            {phase === "capturing" && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 3, fontSize: 9, color: "#10b981" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 1s infinite" }} />
                LIVE · {elapsedSecs}s
              </span>
            )}
            {phase === "static" && <span style={{ fontSize: 9, color: "#a855f7", animation: "pulse 1s infinite" }}>◈ ANALYSING…</span>}
            {phase === "done"   && <span style={{ fontSize: 9, color: "#374151" }}>COMPLETE</span>}
            {isBlocked && phase !== "idle" && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#ef4444", padding: "2px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 3, fontWeight: 700 }}>
                ⊗ BLOCKED BY DPI ENGINE
              </span>
            )}
          </div>
          <p style={{ color: "#374151", fontSize: 9, margin: 0 }}>Visualise DNS · TCP · TLS · CDN · Auth · Real-time packet flow</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ViewToggle view="graph" onChange={setView} canExplain={canExplain} />
          {extToggle}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && runTrace(inputVal)}
          placeholder="instagram.com · youtube.com · https://api.github.com · 1.1.1.1"
          style={{ flex: 1, background: "#0d1117", border: "1px solid #1f2937", borderRadius: 6, padding: "10px 14px", color: "#e5e7eb", fontSize: 11, fontFamily: "IBM Plex Mono", outline: "none" }} />
        <button onClick={isRunning ? stopCapture : () => runTrace(inputVal)}
          style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: isRunning ? "#1f2937" : "#a855f7", color: isRunning ? "#9ca3af" : "#fff", fontSize: 10, fontWeight: 700, fontFamily: "IBM Plex Mono", cursor: "pointer", whiteSpace: "nowrap" }}>
          {isRunning ? "◼ STOP" : "▶ TRACE"}
        </button>
        {phase !== "idle" && (
          <button onClick={handleReset}
            style={{ padding: "10px 12px", borderRadius: 6, border: "1px solid #1f2937", background: "transparent", color: "#4b5563", fontSize: 10, cursor: "pointer", fontFamily: "IBM Plex Mono" }}>
            RESET
          </button>
        )}
      </div>

      {/* Warnings */}
      {!extConnected && phase !== "idle" && (
        <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, fontSize: 9, color: "#ef4444", lineHeight: 1.6 }}>
          ⚡ Extension not connected — static analysis only.<br />
          <span style={{ color: "#6b7280" }}>Fix: <strong style={{ color: "#e5e7eb" }}>chrome://extensions</strong> → DPI Engine → ↺ reload → switch back to this tab</span>
        </div>
      )}
      {isBlocked && phase !== "idle" && (
        <div style={{ marginBottom: 10, padding: "8px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, fontSize: 9, color: "#ef4444", lineHeight: 1.8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>
            ⊗ <strong>{domain}</strong> is <strong>BLOCKED</strong> — rule: <strong style={{ color: "#fca5a5" }}>{matchedRule}</strong>
            <span style={{ color: "#6b7280", marginLeft: 8 }}>· Packets dropped at browser edge before TCP connects</span>
          </span>
          <span style={{ color: "#374151", fontSize: 8, flexShrink: 0, marginLeft: 12 }}>Manage in Live Proxy tab</span>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, fontSize: 9, color: "#ef4444" }}>
          ✗ {error}
        </div>
      )}

      {/* Idle */}
      {phase === "idle" && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 38, marginBottom: 16, color: "#1a1f28" }}>◈</div>
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>Enter any domain, URL, or IP to trace its network path</div>
          <div style={{ fontSize: 9, color: "#1f2937", lineHeight: 2 }}>instagram.com · youtube.com · api.github.com · 1.1.1.1</div>
          {!extConnected && (
            <div style={{ marginTop: 24, padding: "12px 20px", display: "inline-block", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 9, color: "#a855f7", lineHeight: 2 }}>
              For live auth &amp; packet capture:<br />
              <span style={{ color: "#6b7280" }}>Reload extension at chrome://extensions → switch back to this tab</span>
            </div>
          )}
        </div>
      )}

      {phase === "tab-pick" && <TabPicker tabs={openTabs} domain={domain} onSelect={selectTab} />}

      {hasContent && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "#0a0d12", border: `1px solid ${isBlocked ? "rgba(239,68,68,0.35)" : "#1f2937"}`, borderRadius: 10, height: 460, position: "relative", overflow: "hidden", transition: "border-color 0.4s" }}>
              {phase === "static" && !sd && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, zIndex: 5 }}>
                  <div style={{ color: "#a855f7", fontSize: 11, animation: "pulse 1s infinite" }}>◈ TRACING {domain}</div>
                  <div style={{ color: "#374151", fontSize: 9 }}>Resolving DNS · Measuring TCP · Negotiating TLS · Detecting CDN…</div>
                </div>
              )}
              <GraphCanvas sd={sd} lc={lc} phase={phase} isBlocked={isBlocked} />
            </div>
            <div style={{ width: 255, background: "#0a0d12", border: "1px solid #1f2937", borderRadius: 10, padding: "12px 13px", overflowY: "auto", maxHeight: 460 }}>
              <RightPanel sd={sd} lc={lc} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ overflowY: "auto", maxHeight: 280 }}><StaticCompact sd={sd} /></div>
            <div style={{ overflowY: "auto", maxHeight: 280 }}><PacketLog lc={lc} phase={phase} /></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        input:focus { border-color: #a855f7 !important; }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }
      `}</style>
    </div>
  );
}