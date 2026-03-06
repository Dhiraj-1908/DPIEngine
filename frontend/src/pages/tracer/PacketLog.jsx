import { useEffect, useRef, useState } from "react";
import { fmt, statusColor } from "./tracerHelpers";

export default function PacketLog({ lc, phase }) {
  const ref  = useRef(null);
  const seen = useRef(new Set());
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!lc) return;
    const newE = [];
    (lc.responsePackets || []).forEach((p, i) => {
      const id = `r${i}`; if (!seen.current.has(id)) { seen.current.add(id); newE.push({ id, kind: "resp",  ...p }); }
    });
    (lc.apiCalls || []).forEach((p, i) => {
      const id = `a${i}`; if (!seen.current.has(id)) { seen.current.add(id); newE.push({ id, kind: "api",   ...p }); }
    });
    (lc.chunks || []).forEach((p, i) => {
      const id = `c${i}`; if (!seen.current.has(id)) { seen.current.add(id); newE.push({ id, kind: "chunk", ...p }); }
    });
    if (newE.length) setEntries(prev => [...prev, ...newE].slice(-200));
  }, [lc?.responsePackets?.length, lc?.apiCalls?.length, lc?.chunks?.length]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  return (
    <div style={{ background: "#0a0d12", border: "1px solid #1f2937", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #1f2937", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#a855f7", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1 }}>PACKET LOG</span>
        {phase === "capturing" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: "#10b981", fontFamily: "IBM Plex Mono" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 0.8s infinite" }} />
            LIVE
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "#374151", fontSize: 8, fontFamily: "IBM Plex Mono" }}>
          {entries.length} captured
        </span>
      </div>

      {/* Entries */}
      <div ref={ref} style={{ flex: 1, overflowY: "auto", fontFamily: "IBM Plex Mono" }}>
        {entries.length === 0 ? (
          <div style={{ padding: "16px", color: "#1f2937", fontSize: 9, textAlign: "center" }}>
            {lc ? "Interact with the page to capture traffic" : "Waiting…"}
          </div>
        ) : entries.map((e, i) => {
          const isNew = i >= entries.length - 3;
          const base  = {
            display: "flex", alignItems: "center", gap: 6,
            padding: "3px 12px", borderBottom: "1px solid #0d1117",
            animation: isNew ? "slideIn 0.2s" : "none",
            background: isNew ? "rgba(16,185,129,0.018)" : "transparent",
          };

          if (e.kind === "resp") {
            const sc = statusColor(e.status);
            const tc = e.type === "media" ? "#a855f7" : e.type === "api" ? "#06b6d4" : e.type === "image" ? "#f97316" : "#374151";
            return (
              <div key={e.id} style={base}>
                <span style={{ color: sc, fontSize: 8, fontWeight: 700, width: 26, flexShrink: 0 }}>{e.status}</span>
                <span style={{ color: tc, fontSize: 7, width: 34, flexShrink: 0 }}>{e.type}</span>
                <span style={{ color: "#2d3748", fontSize: 8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</span>
                {e.size && <span style={{ color: "#374151", fontSize: 7, flexShrink: 0 }}>{fmt(e.size)}</span>}
              </div>
            );
          }

          if (e.kind === "api") {
            const mc = { GET: "#10b981", POST: "#f59e0b", PUT: "#06b6d4", DELETE: "#ef4444", PATCH: "#a855f7" }[e.method] || "#6b7280";
            return (
              <div key={e.id} style={base}>
                <span style={{ color: mc, fontSize: 8, fontWeight: 700, width: 30, flexShrink: 0 }}>{e.method}</span>
                <span style={{ color: "#374151", fontSize: 8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</span>
              </div>
            );
          }

          if (e.kind === "chunk") {
            const cc = e.type === "audio" ? "#06b6d4" : "#a855f7";
            const icon = e.type === "audio" ? "🔊" : "📹";
            return (
              <div key={e.id} style={base}>
                <span style={{ color: cc, fontSize: 8, fontWeight: 700, width: 42, flexShrink: 0 }}>{icon} {e.type}</span>
                <span style={{ color: "#374151", fontSize: 8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.fromBuffer ? e.range : e.url?.split("/").pop()?.substring(0, 40)}
                </span>
                {e.size && <span style={{ color: "#374151", fontSize: 7, flexShrink: 0 }}>{fmt(e.size)}</span>}
              </div>
            );
          }
          return null;
        })}

        {phase === "capturing" && lc && (
          <div style={{ padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", animation: "pulse 1s infinite" }} />
            <span style={{ color: "#1f2937", fontSize: 8 }}>listening…</span>
          </div>
        )}
      </div>
    </div>
  );
}