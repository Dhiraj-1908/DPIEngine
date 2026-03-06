import { useState, useRef, useEffect, useCallback } from "react";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LAYERS = [
  { id: "action",  label: "USER ACTION",  sub: "Browser Parsing",       color: "#6366f1", marker: "[STEP 1:" },
  { id: "dns",     label: "DNS",          sub: "Name Resolution",       color: "#8b5cf6", marker: "[STEP 2:" },
  { id: "tcp",     label: "TCP",          sub: "3-Way Handshake",       color: "#06b6d4", marker: "[STEP 3:" },
  { id: "tls",     label: "TLS",          sub: "Encryption",            color: "#10b981", marker: "[STEP 4:" },
  { id: "http",    label: "HTTP REQUEST", sub: "What Browser Sends",    color: "#34d399", marker: "[STEP 5:" },
  { id: "cdn",     label: "CDN / LB",     sub: "Edge Routing",          color: "#f59e0b", marker: "[STEP 6:" },
  { id: "backend", label: "BACKEND",      sub: "Server Infrastructure", color: "#f97316", marker: "[STEP 7:" },
  { id: "packets", label: "PACKETS",      sub: "Data Transmission",     color: "#ef4444", marker: "[STEP 8:" },
  { id: "render",  label: "RENDERING",    sub: "Browser Pipeline",      color: "#a78bfa", marker: "[STEP 9:" },
  { id: "stream",  label: "STREAMING",    sub: "Advanced Protocols",    color: "#a855f7", marker: "[STEP 10:" },
  { id: "verdict", label: "VERDICT",      sub: "Summary",               color: "#e5e7eb", marker: "[VERDICT]" },
];

// The DPI block layer — prepended to sidebar when blocked
const DPI_LAYER = {
  id: "dpiblock", label: "DPI BLOCK", sub: "Extension Intercept", color: "#ef4444",
};

function renderBold(text) {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <span key={i} style={{ color: "#e5e7eb", fontWeight: 700 }}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>
  );
}

function parseSections(raw) {
  const sections = [];
  const lines    = raw.split("\n");
  let current    = null;

  for (const line of lines) {
    const stepMatch = line.match(/^\[STEP \d+:\s*([^\]]+)\]/) || line.match(/^\[(VERDICT)\]/);
    if (stepMatch) {
      if (current) sections.push(current);
      const fullTitle = line.replace(/^\[/, "").replace(/\]$/, "").trim();
      const layer     = LAYERS.find(l => raw.includes(l.marker) && line.startsWith(l.marker));
      current = { title: fullTitle, body: "", color: layer?.color || "#6b7280", layerId: layer?.id };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function getActiveLayer(raw) {
  let active = null;
  for (const layer of LAYERS) {
    if (raw.includes(layer.marker)) active = layer.id;
  }
  return active;
}

// ── DPI Block technical details section ──────────────────────────────────────
function DPIBlockSection({ domain, matchedRule, ruleType, sd }) {
  const isApp    = ruleType === "app";
  const ruleName = matchedRule || domain;

  // Build the technical detail rows
  const rows = [
    { label: "INTERCEPT LAYER",  val: "Chrome Extension MV3 — webRequest API",     color: "#ef4444" },
    { label: "API USED",         val: "chrome.webRequest.onBeforeRequest",          color: "#f87171" },
    { label: "TRIGGER POINT",    val: "Before TCP connection — URL pattern match",  color: "#f87171" },
    { label: "RULE TYPE",        val: isApp ? "Built-in app signature" : "Custom domain rule", color: "#f87171" },
    { label: "MATCHED RULE",     val: ruleName,                                     color: "#fca5a5" },
    { label: "ACTION",           val: "chrome.webRequest.BlockingResponse → cancel: true", color: "#f87171" },
    { label: "TLS DECRYPTION",   val: "NOT required — block happens before TCP",    color: "#6b7280" },
    { label: "OSI LAYER",        val: "Layer 7 (Application) — hostname/SNI match", color: "#f87171" },
    { label: "BYPASS POSSIBLE",  val: "No — every outbound request is inspected",   color: "#6b7280" },
  ];

  if (sd?.dns?.resolved_ip) {
    rows.splice(3, 0, { label: "TARGET IP (RESOLVED)", val: sd.dns.resolved_ip, color: "#f87171" });
  }

  return (
    <div style={{ marginBottom: 36, animation: "slideUp 0.2s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#ef4444", fontSize: 11, lineHeight: 1 }}>⊗</span>
        </div>
        <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
          DPI ENGINE — TRAFFIC BLOCKED
        </span>
        <span style={{ fontSize: 7.5, color: "#ef444488", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 3, padding: "1px 6px" }}>
          LAYER 0
        </span>
      </div>

      {/* Explanation prose */}
      <div style={{ paddingLeft: 16, borderLeft: "2px solid rgba(239,68,68,0.2)", marginLeft: 11, marginBottom: 16 }}>
        <p style={{ color: "#6b7280", fontSize: 9.5, lineHeight: 2, margin: "0 0 10px", fontFamily: "IBM Plex Mono" }}>
          Before your browser could even perform a DNS lookup for <span style={{ color: "#fca5a5", fontWeight: 700 }}>{domain}</span>, the{" "}
          <span style={{ color: "#ef4444", fontWeight: 700 }}>DPI Engine Chrome Extension</span> intercepted the outgoing request using the{" "}
          <span style={{ color: "#e5e7eb" }}>chrome.webRequest.onBeforeRequest</span> API.
          This API fires at the earliest possible moment in the browser's network stack —{" "}
          <span style={{ color: "#e5e7eb" }}>before TCP connects, before TLS negotiates, before any packet leaves your machine.</span>
        </p>
        <p style={{ color: "#6b7280", fontSize: 9.5, lineHeight: 2, margin: "0 0 10px", fontFamily: "IBM Plex Mono" }}>
          The extension matched the request URL against the rule{" "}
          <span style={{ color: "#fca5a5", fontWeight: 700 }}>"{ruleName}"</span>{" "}
          ({isApp ? "a built-in app signature rule" : "a custom domain rule you added"}) and returned{" "}
          <span style={{ color: "#e5e7eb" }}>{'{ cancel: true }'}</span> — instructing Chrome to immediately abort the request.
          No data was transmitted. No DNS query was sent. The server at{" "}
          {sd?.dns?.resolved_ip
            ? <span style={{ color: "#e5e7eb" }}>{sd.dns.resolved_ip}</span>
            : <span style={{ color: "#e5e7eb" }}>{domain}</span>
          }{" "}received zero bytes.
        </p>
        <p style={{ color: "#4b5563", fontSize: 9.5, lineHeight: 2, margin: 0, fontFamily: "IBM Plex Mono" }}>
          This is functionally identical to an <span style={{ color: "#e5e7eb" }}>ISP-level firewall DROP rule</span>, but operating at the{" "}
          browser application layer. No TLS decryption is needed because we block{" "}
          <span style={{ color: "#e5e7eb" }}>before the TLS handshake begins</span> — purely on hostname/SNI pattern matching.
        </p>
      </div>

      {/* Technical detail table */}
      <div style={{ paddingLeft: 27, display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ color: "#374151", fontSize: 7.5, letterSpacing: 1, marginBottom: 8, fontFamily: "IBM Plex Mono" }}>
          TECHNICAL DETAILS
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 0, padding: "4px 0", borderBottom: "1px solid rgba(239,68,68,0.04)" }}>
            <span style={{ color: "#374151", fontSize: 8, fontFamily: "IBM Plex Mono", width: 180, flexShrink: 0 }}>{row.label}</span>
            <span style={{ color: row.color, fontSize: 8.5, fontFamily: "IBM Plex Mono", fontWeight: row.color === "#fca5a5" ? 700 : 400 }}>{row.val}</span>
          </div>
        ))}
      </div>

      {/* What would have happened */}
      <div style={{ marginTop: 20, paddingLeft: 27 }}>
        <div style={{ color: "#374151", fontSize: 7.5, letterSpacing: 1, marginBottom: 10, fontFamily: "IBM Plex Mono" }}>
          WHAT WOULD HAVE HAPPENED (WITHOUT THE BLOCK)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
          {[
            { label: "DNS QUERY",     color: "#8b5cf6", dim: false },
            { label: "TCP SYN",       color: "#06b6d4", dim: false },
            { label: "TLS HELLO",     color: "#10b981", dim: false },
            { label: "HTTP REQUEST",  color: "#34d399", dim: false },
            { label: "CDN EDGE",      color: "#f59e0b", dim: false },
            { label: "ORIGIN SERVER", color: "#f97316", dim: false },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ padding: "4px 10px", background: step.color + "12", border: `1px solid ${step.color}30`, borderRadius: 4, fontSize: 7.5, color: step.color, fontFamily: "IBM Plex Mono", fontWeight: 700 }}>
                {step.label}
              </div>
              {i < arr.length - 1 && (
                <span style={{ color: "#1f2937", fontSize: 9, margin: "0 4px" }}>→</span>
              )}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", marginLeft: 4 }}>
            <span style={{ color: "#1f2937", fontSize: 9, marginRight: 4 }}>→</span>
            <div style={{ padding: "4px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, fontSize: 7.5, color: "#ef4444", fontFamily: "IBM Plex Mono", fontWeight: 700 }}>
              ⊗ BLOCKED HERE
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, color: "#374151", fontSize: 8.5, fontFamily: "IBM Plex Mono", lineHeight: 1.8 }}>
          The block occurs at step 0 — before the DNS query even leaves the browser.
          The analysis below shows what the network path <span style={{ color: "#4b5563" }}>would look like</span> if the rule were disabled.
        </div>
      </div>

      {/* Divider into normal AI analysis */}
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(239,68,68,0.12)" }} />
        <span style={{ color: "#374151", fontSize: 7.5, fontFamily: "IBM Plex Mono", letterSpacing: 1 }}>
          THEORETICAL PATH IF UNBLOCKED
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(239,68,68,0.12)" }} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AIExplainPage({
  sd, lc, domain, onClose,
  initialRaw = "", initialDone = false, onCacheUpdate,
  isBlocked = false, matchedRule = null, ruleType = null,
}) {
  const [raw,     setRaw]     = useState(initialRaw);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [done,    setDone]    = useState(initialDone);
  const scrollRef = useRef(null);
  const accumRef  = useRef(initialRaw); // tracks full text independent of React state
  const abortRef  = useRef(null);

  const sections    = parseSections(raw);
  const activeLayer = getActiveLayer(raw);

  // Sidebar layers — prepend DPI block layer if blocked
  const sidebarLayers = isBlocked ? [DPI_LAYER, ...LAYERS] : LAYERS;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [raw]);

  const stream = useCallback(async () => {
    setRaw(""); setError(null); setDone(false); setLoading(true);
    accumRef.current = "";
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BACKEND}/explain`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ domain, staticData: sd, liveCapture: lc || null }),
        signal:  abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { t } = JSON.parse(line.slice(6));
            if (t) setRaw(prev => { const next = prev + t; accumRef.current = next; onCacheUpdate?.(next, false); return next; });
          } catch { /* skip */ }
        }
      }
      setDone(true);
      onCacheUpdate?.(accumRef.current, true);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [domain, sd, lc]);

  useEffect(() => { return () => abortRef.current?.abort(); }, []);

  return (
    <div style={{ background: "#060810", display: "flex", flexDirection: "column", fontFamily: "IBM Plex Mono", minHeight: "100vh", animation: "fadeIn 0.18s ease" }}>
      <div style={{ flex: 1, display: "flex", minHeight: "calc(100vh - 52px)" }}>

        {/* Left sidebar */}
        <div style={{ width: 160, flexShrink: 0, borderRight: "1px solid #0d1117", background: "#080b10", padding: "20px 0", overflowY: "visible" }}>
          <div style={{ padding: "0 14px 12px", color: "#1f2937", fontSize: 7.5, letterSpacing: 1 }}>PROTOCOL LAYERS</div>

          {sidebarLayers.map((layer, i) => {
            // DPI block layer is always "reached" and "active-at-top" when blocked
            const isDPILayer = layer.id === "dpiblock";
            const reached    = isDPILayer ? isBlocked : raw.includes(layer.marker);
            const active     = isDPILayer ? false : activeLayer === layer.id;
            const isLastLayer = i === sidebarLayers.length - 1;

            return (
              <div key={layer.id} style={{ display: "flex", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    border: `1.5px solid ${reached ? layer.color : "#1f2937"}`,
                    background: active ? layer.color : reached ? layer.color + "22" : "transparent",
                    flexShrink: 0, marginTop: 14, transition: "all 0.3s",
                    boxShadow: isDPILayer && isBlocked ? `0 0 10px ${layer.color}` : active ? `0 0 8px ${layer.color}` : "none",
                  }} />
                  {!isLastLayer && (
                    <div style={{ width: 1, flex: 1, minHeight: 20, background: reached ? layer.color + "30" : "#0d1117", transition: "background 0.5s" }} />
                  )}
                </div>
                <div style={{ padding: "10px 0 10px 4px", flex: 1 }}>
                  <div style={{ color: reached ? layer.color : "#1f2937", fontSize: 8, fontWeight: 700, letterSpacing: 0.5, transition: "color 0.3s" }}>
                    {layer.label}
                    {active && <span style={{ marginLeft: 4, animation: "blink 0.5s infinite" }}>▌</span>}
                    {isDPILayer && isBlocked && <span style={{ marginLeft: 4, fontSize: 7 }}>⊗</span>}
                  </div>
                  <div style={{ color: reached ? "#374151" : "#111827", fontSize: 7, marginTop: 1 }}>{layer.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "28px 40px 40px" }}>

          {/* Domain header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: "#1f2937", fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>NETWORK ANALYSIS REPORT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#e5e7eb", fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>{domain}</span>
              {isBlocked && (
                <span style={{ fontSize: 8, color: "#ef4444", padding: "3px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, fontWeight: 700 }}>
                  ⊗ BLOCKED
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              {sd?.dns?.resolved_ip    && <Chip label="IP"       val={sd.dns.resolved_ip}            color="#8b5cf6" />}
              {sd?.tls?.tcp_rtt_ms     && <Chip label="RTT"      val={`${sd.tls.tcp_rtt_ms}ms`}     color="#06b6d4" />}
              {sd?.tls?.tls_version    && <Chip label="TLS"      val={sd.tls.tls_version}             color="#10b981" />}
              {sd?.http?.cdn?.name     && <Chip label="CDN"      val={sd.http.cdn.name}               color="#f59e0b" />}
              {sd?.http?.status_code   && <Chip label="HTTP"     val={String(sd.http.status_code)}   color="#10b981" />}
              {lc?.requestCount > 0    && <Chip label="REQUESTS" val={String(lc.requestCount)}       color="#a855f7" />}
              {isBlocked && matchedRule && <Chip label="RULE"    val={matchedRule}                    color="#ef4444" />}
            </div>
          </div>

          <div style={{ width: "100%", height: 1, background: "#0d1117", marginBottom: 28 }} />

          {/* ── DPI Block section — shown unconditionally when blocked ── */}
          {isBlocked && (
            <DPIBlockSection
              domain={domain}
              matchedRule={matchedRule}
              ruleType={ruleType}
              sd={sd}
            />
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "#ef4444", fontSize: 9, marginBottom: 20 }}>
              ✗ {error} — check that OPENROUTER_API_KEY is set on the backend.
            </div>
          )}

          {/* Idle */}
          {!loading && !raw && !error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 20 }}>
              <div style={{ fontSize: 32, color: "#1a2030" }}>◈</div>
              <div style={{ color: "#374151", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
                {isBlocked
                  ? <>DPI block explained above · Generate the <span style={{ color: "#4b5563" }}>theoretical</span> network path</>
                  : <>10-step professor-mode analysis ready<br /><span style={{ color: "#1f2937", fontSize: 8.5 }}>DNS · TCP · TLS · CDN · Backend · Streaming</span></>
                }
              </div>
              <button onClick={stream} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 7, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: 10, fontWeight: 700, fontFamily: "IBM Plex Mono", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.2)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.7)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.1)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; }}>
                <span style={{ fontSize: 14 }}>◈</span>
                {isBlocked ? "GENERATE THEORETICAL PATH" : "GENERATE ANALYSIS"}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && !raw && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Resolving network layers…", "Parsing DNS records…", "Analysing TLS handshake…", "Mapping CDN topology…", "Composing explanation…"].map((msg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, animation: `fadeIn ${0.15 * i}s ease` }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#1f2937", animation: "blink 1s infinite", animationDelay: `${i * 0.2}s` }} />
                  <span style={{ color: "#1f2937", fontSize: 8.5 }}>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {sections.map((sec, i) => (
            <Section key={i} section={sec} isLast={i === sections.length - 1} isStreaming={loading && i === sections.length - 1} />
          ))}

          {loading && raw && (
            <span style={{ display: "inline-block", width: 8, height: 14, background: "#a855f7", marginLeft: 2, animation: "blink 0.5s infinite", verticalAlign: "middle", borderRadius: 1 }} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-track { background: #080b10; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function Section({ section, isLast, isStreaming }) {
  const stepMatch = section.title.match(/^STEP (\d+):\s*(.+)/);
  const stepNum   = stepMatch ? stepMatch[1] : null;
  const stepTitle = stepMatch ? stepMatch[2] : section.title;

  return (
    <div style={{ marginBottom: 32, animation: "slideUp 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {stepNum && (
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: (section.color || "#6b7280") + "18", border: `1px solid ${section.color || "#6b7280"}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: section.color || "#6b7280", fontSize: 8, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>{stepNum}</span>
          </div>
        )}
        <span style={{ color: section.color || "#e5e7eb", fontSize: 10, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1 }}>
          {stepTitle}
        </span>
        {isStreaming && (
          <span style={{ fontSize: 7.5, color: section.color, fontFamily: "IBM Plex Mono", animation: "blink 0.7s infinite" }}>● LIVE</span>
        )}
      </div>
      <div style={{ paddingLeft: 16, color: "#4b5563", fontSize: 9.5, fontFamily: "IBM Plex Mono", lineHeight: 2, whiteSpace: "pre-wrap", borderLeft: `2px solid ${section.color || "#1f2937"}20`, marginLeft: stepNum ? 11 : 0 }}>
        {renderBold(section.body.trim())}
      </div>
    </div>
  );
}

function Chip({ label, val, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", background: color + "0d", border: `1px solid ${color}22`, borderRadius: 4 }}>
      <span style={{ color: "#374151", fontSize: 7.5, fontFamily: "IBM Plex Mono" }}>{label}</span>
      <span style={{ color: color, fontSize: 7.5, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>{val}</span>
    </div>
  );
}