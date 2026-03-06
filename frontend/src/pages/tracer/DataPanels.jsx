import { statusColor } from "./tracerHelpers";

function DetailRow({ label, value, vc }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
      <span style={{ color: "#4b5563", fontSize: 8.5, fontFamily: "IBM Plex Mono", flexShrink: 0 }}>{label}</span>
      <span style={{ color: vc || "#9ca3af", fontSize: 8.5, fontFamily: "IBM Plex Mono", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Card({ title, badge, bc, children }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 8, padding: "11px 13px", marginBottom: 9 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ color: "#d1d5db", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1 }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 7, padding: "2px 6px", borderRadius: 3, fontFamily: "IBM Plex Mono", fontWeight: 700, background: bc + "18", color: bc, border: `1px solid ${bc}33` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function RightPanel({ sd, lc }) {
  if (!sd) return (
    <div style={{ color: "#1f2937", fontSize: 9, fontFamily: "IBM Plex Mono", padding: "20px 0", textAlign: "center", lineHeight: 2 }}>
      Run a trace<br />to see details
    </div>
  );
  return (
    <div>
      {sd.dns?.success && (
        <Card title="DNS RESOLUTION" badge="• RESOLVED" bc="#10b981">
          <DetailRow label="Resolved IP"  value={sd.dns.resolved_ip}                                  vc="#8b5cf6" />
          <DetailRow label="TTL"          value={sd.dns.ttl != null ? `${sd.dns.ttl}s` : "—"}        />
          {sd.dns.records?.NS?.length > 0 && (
            <DetailRow label="Nameservers" value={sd.dns.records.NS.slice(0, 2).join(", ")} />
          )}
          {sd.dns.records?.AAAA?.length > 0 && (
            <DetailRow label="IPv6" value={sd.dns.records.AAAA[0]} />
          )}
        </Card>
      )}
      {sd.tls?.success && (
        <Card title="TLS HANDSHAKE" badge={`• ${sd.tls.tls_version}`} bc="#06b6d4">
          <DetailRow label="Cipher"   value={sd.tls.cipher_suite}                                     vc="#06b6d4" />
          <DetailRow label="Bits"     value={sd.tls.cipher_bits ? `${sd.tls.cipher_bits}-bit` : "—"} />
          <DetailRow label="Issuer"   value={sd.tls.issuer_org}                                       />
          <DetailRow label="TCP RTT"  value={sd.tls.tcp_rtt_ms != null ? `${sd.tls.tcp_rtt_ms}ms` : "—"} vc="#10b981" />
          <DetailRow label="Expires"  value={sd.tls.valid_until}                                      />
          <DetailRow label="SANs"     value={sd.tls.san_count != null ? `${sd.tls.san_count} domains` : "—"} />
        </Card>
      )}
      {sd.http?.success && (
        <Card title="CDN / HTTP" badge={`• ${sd.http.status_code}`} bc={statusColor(sd.http.status_code)}>
          <DetailRow label="CDN"       value={sd.http.cdn?.name || "Direct"}                          vc="#f97316" />
          <DetailRow label="Protocol"  value={sd.http.protocol}                                       />
          <DetailRow label="Response"  value={sd.http.response_time_ms != null ? `${sd.http.response_time_ms}ms` : "—"} vc="#10b981" />
          <DetailRow label="Server"    value={sd.http.server || "hidden"}                             />
          {sd.http.redirect_chain?.length > 0 && (
            <DetailRow label="Redirects" value={`${sd.http.redirect_chain.length} hop(s)`} />
          )}
          {sd.http.security_headers && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 7 }}>
              {Object.entries(sd.http.security_headers).map(([k, v]) => (
                <span key={k} style={{
                  fontSize: 6.5, padding: "1px 4px", borderRadius: 2,
                  background: v ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  color: v ? "#10b981" : "#ef4444",
                  border: `1px solid ${v ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}>
                  {k.replace(/_/g, "-").toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
      {lc && (
        <Card title="AUTH STATE" badge={lc.authState?.isAuthenticated ? "• LOGGED IN" : "• ANONYMOUS"} bc={lc.authState?.isAuthenticated ? "#10b981" : "#6b7280"}>
          {lc.authState?.isAuthenticated ? (
            <>
              <DetailRow label="Auth type" value={lc.authState.authType} vc="#10b981" />
              {lc.authState.tokens?.slice(0, 2).map((t, i) => (
                <DetailRow key={i} label={t.type} value={t.value} />
              ))}
              {lc.authState.cookies?.slice(0, 3).map((c, i) => (
                <DetailRow key={i} label={c.name} value={c.value} />
              ))}
            </>
          ) : (
            <div style={{ color: "#374151", fontSize: 8.5, fontFamily: "IBM Plex Mono" }}>No auth credentials detected</div>
          )}
        </Card>
      )}
    </div>
  );
}

export function StaticCompact({ sd }) {
  if (!sd) return (
    <div style={{ background: "#0a0d12", border: "1px solid #1f2937", borderRadius: 8, padding: "12px 14px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#1f2937", fontSize: 9, fontFamily: "IBM Plex Mono" }}>Awaiting trace…</span>
    </div>
  );

  const rows = [
    sd.dns?.success      && { label: "DNS",      value: `${sd.dns.resolved_ip} · TTL ${sd.dns.ttl ?? "—"}s`,                              color: "#8b5cf6" },
    sd.ip_intel?.success && { label: "Location", value: `${sd.ip_intel.city}, ${sd.ip_intel.country} · ${sd.ip_intel.isp}`,               color: "#06b6d4" },
    sd.tls?.success      && { label: "TLS",      value: `${sd.tls.tls_version} · ${sd.tls.cipher_suite}`,                                 color: "#10b981" },
    sd.tls?.success      && { label: "RTT",      value: `${sd.tls.tcp_rtt_ms ?? "—"}ms · expires ${sd.tls.valid_until ?? "—"}`,           color: "#10b981" },
    sd.http?.success     && { label: "CDN",      value: sd.http.cdn?.name || "Direct",                                                    color: "#f97316" },
    sd.http?.success     && { label: "HTTP",     value: `${sd.http.status_code} · ${sd.http.response_time_ms ?? "—"}ms · ${sd.http.server || "hidden"}`, color: statusColor(sd.http.status_code) },
  ].filter(Boolean);

  return (
    <div style={{ background: "#0a0d12", border: "1px solid #1f2937", borderRadius: 8, padding: "12px 14px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1, marginBottom: 10, flexShrink: 0 }}>STATIC ANALYSIS</div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#374151", fontSize: 8.5, fontFamily: "IBM Plex Mono", width: 50, flexShrink: 0 }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: 8.5, fontFamily: "IBM Plex Mono", flex: 1, wordBreak: "break-all", lineHeight: 1.4 }}>{r.value}</span>
          </div>
        ))}
        {sd.http?.security_headers && (
          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 3 }}>
            {Object.entries(sd.http.security_headers).map(([k, v]) => (
              <span key={k} style={{
                fontSize: 6.5, padding: "1px 4px", borderRadius: 2,
                background: v ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                color: v ? "#10b981" : "#ef4444",
                border: `1px solid ${v ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}>
                {k.replace(/_/g, "-").toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}