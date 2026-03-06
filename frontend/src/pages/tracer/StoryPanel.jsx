import { useState } from "react";
import { R, statusColor } from "./tracerHelpers";

// ─── Inline value accent ──────────────────────────────────────────────────────
function V({ c, children }) {
  return (
    <span style={{ color: c || "#e5e7eb", fontWeight: 700 }}>{children}</span>
  );
}

// ─── Compact data table inside a step ────────────────────────────────────────
function Table({ rows }) {
  return (
    <div style={{
      background: "#080b10", border: "1px solid #1a1f2e",
      borderRadius: 5, padding: "6px 10px", margin: "7px 0",
    }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "2px 0", borderBottom: i < rows.length - 1 ? "1px solid #0d1117" : "none" }}>
          <span style={{ color: "#374151", fontSize: 7.5, fontFamily: "IBM Plex Mono", flexShrink: 0, minWidth: 72 }}>{row.k}</span>
          <span style={{ color: row.c || "#6b7280", fontSize: 7.5, fontFamily: "IBM Plex Mono", textAlign: "right", wordBreak: "break-all", lineHeight: 1.45 }}>{row.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Security header entries ──────────────────────────────────────────────────
const SEC_INFO = {
  hsts:            { label: "HSTS",            good: "Forces HTTPS always — even if you type http://",     bad: "Not set — users could be served over unencrypted HTTP" },
  csp:             { label: "CSP",             good: "Controls which scripts can run — blocks XSS attacks", bad: "Not set — any injected script will run in the browser" },
  x_frame:         { label: "X-Frame-Options", good: "Page can't be put inside an iframe — blocks clickjacking", bad: "Not set — this page could be embedded invisibly in another page" },
  x_content_type:  { label: "X-Content-Type",  good: "Browser won't guess file types — prevents MIME attacks", bad: "Not set — browser may mis-execute files as the wrong type" },
  referrer_policy: { label: "Referrer-Policy", good: "Controls what URL your browser sends when leaving this page", bad: "Not set — full URL leaked to every third-party site you visit" },
};

// ─── Build steps from real captured data ─────────────────────────────────────
function buildSteps(sd, lc, domain) {
  const steps = [];

  // 1 ── DNS ──────────────────────────────────────────────────────────────────
  if (sd?.dns) {
    const dns = sd.dns;
    const ip  = R(dns.resolved_ip);
    const ttl = dns.ttl != null ? dns.ttl : null;

    steps.push({
      num: 1, color: "#8b5cf6", title: "Name Lookup (DNS)",
      body: (
        <>
          Your browser doesn't understand domain names — it needs a number.
          It asked a DNS resolver: <V c="#8b5cf6">"what's the IP address for {domain || "—"}?"</V>{" "}
          The resolver replied: <V c="#8b5cf6">{ip}</V>.
          {ttl != null
            ? <> This answer is good for <V c="#f59e0b">{ttl} seconds</V>, then the browser must ask again.</>
            : <> The TTL wasn't captured — the answer may have come from cache.</>}
        </>
      ),
      table: [
        { k: "Domain asked",   v: R(domain),             c: "#9ca3af" },
        { k: "IP resolved to", v: ip,                    c: "#8b5cf6" },
        { k: "TTL (cache)",    v: ttl != null ? `${ttl}s` : "—", c: "#f59e0b" },
        { k: "Nameserver",     v: R(dns.records?.NS?.[0]?.replace(/\.$/, "")), c: "#6b7280" },
        { k: "IPv6 address",   v: R(dns.records?.AAAA?.[0]), c: "#6b7280" },
      ],
    });
  }

  // 2 ── TCP ──────────────────────────────────────────────────────────────────
  if (sd?.tls?.success) {
    const rtt = sd.tls.tcp_rtt_ms;
    const dist = rtt == null ? null
      : rtt < 20  ? "same city / region"
      : rtt < 80  ? "same continent"
      : rtt < 200 ? "different continent"
      : "very far away";

    steps.push({
      num: 2, color: "#06b6d4", title: "Opening a Connection (TCP)",
      body: (
        <>
          Before sending any data, the browser opened a reliable channel.
          It sent a <V c="#06b6d4">SYN</V> packet — like knocking on a door.
          The server replied <V c="#06b6d4">SYN-ACK</V>, the browser confirmed with <V c="#06b6d4">ACK</V>.
          {rtt != null
            ? <> That round-trip took <V c={rtt < 50 ? "#10b981" : rtt < 150 ? "#f59e0b" : "#ef4444"}>{rtt}ms</V> — the server is likely {dist}.</>
            : <> RTT wasn't measured this trace.</>}
        </>
      ),
      table: [
        { k: "Server address", v: `${R(sd.dns?.resolved_ip)}:443`,                              c: "#06b6d4" },
        { k: "Round-trip time",v: rtt != null ? `${rtt}ms` : "—",                              c: rtt != null ? (rtt < 50 ? "#10b981" : rtt < 150 ? "#f59e0b" : "#ef4444") : "#6b7280" },
        { k: "Port",           v: "443 (HTTPS)",                                                c: "#9ca3af" },
        { k: "Proximity hint", v: dist || "—",                                                  c: "#6b7280" },
      ],
    });
  }

  // 3 ── TLS ──────────────────────────────────────────────────────────────────
  if (sd?.tls?.success) {
    const tls      = sd.tls;
    const isLatest = tls.tls_version === "TLSv1.3";

    steps.push({
      num: 3, color: "#10b981", title: "Locking the Channel (TLS)",
      body: (
        <>
          Both sides agreed on an encryption algorithm.
          Now every byte — your password, your cookies, everything — travels as scrambled data.
          {" "}<V c="#10b981">Your ISP, your router, anyone on the network can see packets but cannot read them.</V>
          {" "}Protocol: <V c="#06b6d4">{R(tls.tls_version)}</V>.
          {" "}Certificate issued by <V c="#9ca3af">{R(tls.issuer_org)}</V>.
          {!isLatest && <> (TLS 1.3 is the current standard — this server uses an older version.)</>}
        </>
      ),
      table: [
        { k: "TLS version",   v: R(tls.tls_version),                                           c: isLatest ? "#10b981" : "#f59e0b" },
        { k: "Cipher suite",  v: R(tls.cipher_suite),                                          c: "#06b6d4" },
        { k: "Key strength",  v: tls.cipher_bits ? `${tls.cipher_bits}-bit` : "—",             c: "#9ca3af" },
        { k: "Cert issuer",   v: R(tls.issuer_org),                                            c: "#9ca3af" },
        { k: "Cert expires",  v: R(tls.valid_until),                                           c: "#f59e0b" },
        { k: "Covers",        v: tls.san_count != null ? `${tls.san_count} domains` : "—",     c: "#6b7280" },
      ],
    });
  }

  // 4 ── IP Geolocation ───────────────────────────────────────────────────────
  if (sd?.ip_intel?.success) {
    const ip = sd.ip_intel;

    steps.push({
      num: 4, color: "#f97316", title: "Where is the Server? (IP Geo)",
      body: (
        <>
          The IP address <V c="#f97316">{R(ip.query)}</V> is registered to{" "}
          <V c="#f97316">{R(ip.isp)}</V> in <V c="#f97316">{R(ip.city)}, {R(ip.country)}</V>.
          {ip.hosting
            ? <> This is a <V c="#f59e0b">datacenter IP</V> — typical for CDN edge nodes and cloud servers, not a home connection.</>
            : ip.hosting === false
            ? <> This is not flagged as a datacenter — could be a residential ISP or edge relay.</>
            : null}
        </>
      ),
      table: [
        { k: "IP address", v: R(ip.query),                                                      c: "#f97316" },
        { k: "City",       v: R(ip.city),                                                       c: "#9ca3af" },
        { k: "Region",     v: `${R(ip.regionName)}, ${R(ip.country)}`,                          c: "#9ca3af" },
        { k: "ISP / Org",  v: R(ip.isp),                                                        c: "#9ca3af" },
        { k: "ASN",        v: R(ip.as),                                                         c: "#6b7280" },
      ],
    });
  }

  // 5 ── HTTP + CDN ──────────────────────────────────────────────────────────
  if (sd?.http?.success) {
    const http   = sd.http;
    const hasCDN = http.cdn?.name && http.cdn.name !== "Direct / Unknown";
    const isStreaming = lc?.chunks?.length > 0;

    steps.push({
      num: 5, color: "#f59e0b", title: hasCDN ? "Request Served via CDN" : "Request Reached Origin Server",
      body: hasCDN ? (
        <>
          Your request never reached the main server.
          {" "}<V c="#f59e0b">{http.cdn.name}</V> has a copy of the content at an edge node near you.
          {" "}Evidence: <V c="#6b7280">{R(http.cdn.evidence)}</V>.
          {" "}This is why fast sites load in milliseconds — they serve content from hundreds of locations worldwide.
          {" "}Response: <V c={statusColor(http.status_code)}>HTTP {http.status_code}</V> in <V c="#10b981">{R(http.response_time_ms)}ms</V>.
          {isStreaming && (
            <> The video player then requested individual <V c="#a855f7">segments</V> — small chunks of the video — one at a time via HTTP Range requests, buffering a few seconds ahead as you watch.</>
          )}
        </>
      ) : (
        <>
          The request went all the way to the origin server. No CDN was detected.
          {" "}Response: <V c={statusColor(http.status_code)}>HTTP {http.status_code}</V> in <V c="#10b981">{R(http.response_time_ms)}ms</V>.
          {" "}Server software: <V c="#9ca3af">{R(http.server)}</V>.
        </>
      ),
      table: [
        { k: "HTTP status",   v: `${R(http.status_code)} ${http.status_code < 400 ? "OK" : "Error"}`, c: statusColor(http.status_code) },
        { k: "Response time", v: http.response_time_ms != null ? `${http.response_time_ms}ms` : "—",  c: http.response_time_ms < 200 ? "#10b981" : http.response_time_ms < 500 ? "#f59e0b" : "#ef4444" },
        { k: "Protocol",      v: R(http.protocol),                                                     c: "#9ca3af" },
        { k: "CDN",           v: hasCDN ? R(http.cdn.name) : "None detected",                         c: hasCDN ? "#f59e0b" : "#6b7280" },
        { k: "Server",        v: R(http.server),                                                       c: "#6b7280" },
        ...(http.redirect_chain?.length > 0
          ? [{ k: "Redirects", v: http.redirect_chain.map(r => r.status).join(" → "), c: "#6b7280" }]
          : []),
      ],
    });
  }

  // 6 ── Security headers ────────────────────────────────────────────────────
  if (sd?.http?.security_headers) {
    const sh      = sd.http.security_headers;
    const present = Object.values(sh).filter(Boolean).length;
    const total   = Object.keys(sh).length;
    const allGood = present === total;

    steps.push({
      num: 6, color: allGood ? "#10b981" : "#f59e0b",
      title: "Security Headers",
      body: (
        <>
          The server sent <V c={allGood ? "#10b981" : "#f59e0b"}>{present} of {total}</V> standard security headers.
          {" "}These are instructions the server gives the browser — not encryption, just rules about what the browser is allowed to do on this page.
          {!allGood && <> Missing headers mean the browser has fewer guardrails against certain attacks.</>}
        </>
      ),
      secHeaders: sh,
    });
  }

  // 7 ── Auth (live only) ────────────────────────────────────────────────────
  if (lc) {
    const auth   = lc.authState;
    const isAuth = auth?.isAuthenticated;

    steps.push({
      num: 7, color: isAuth ? "#10b981" : "#6b7280",
      title: "Is the Browser Logged In?",
      body: isAuth ? (
        <>
          Yes. Every outgoing request carries a <V c="#10b981">{R(auth.authType)}</V>.
          The server can identify who you are from this token — it's like a wristband at an event.
          It was captured live from this browser's actual requests.
        </>
      ) : (
        <>
          No credentials found in the outgoing requests. The browser is sending as an anonymous visitor.
          {auth?.cookies?.length > 0
            ? <> {auth.cookies.length} tracking cookie(s) are present but these are not login credentials.</>
            : null}
          {" "}If you're logged in on the site's tab, try scrolling or clicking there to trigger a network request.
        </>
      ),
      table: [
        { k: "Logged in",  v: isAuth ? "YES" : "NO",                                          c: isAuth ? "#10b981" : "#6b7280" },
        { k: "Method",     v: R(auth?.authType),                                               c: "#9ca3af" },
        { k: "Cookies",    v: auth?.cookies?.length != null ? `${auth.cookies.length}` : "—", c: "#9ca3af" },
        { k: "Tokens",     v: auth?.tokens?.length != null ? `${auth.tokens.length}` : "—",   c: "#9ca3af" },
      ],
    });
  }

  // 8 ── Live traffic (live only, and only when there is traffic) ─────────────
  if (lc && lc.requestCount > 0) {
    const vChunks = lc.chunks?.filter(c => c.type === "video").length || 0;
    const aChunks = lc.chunks?.filter(c => c.type === "audio").length || 0;
    const hasMedia = vChunks > 0 || aChunks > 0;
    const topStatus = Object.entries(lc.statusCodes || {}).sort((a, b) => b[1] - a[1]);

    steps.push({
      num: 8, color: "#a855f7", title: "What's Actually Flowing",
      body: (
        <>
          <V c="#a855f7">{R(lc.requestCount)}</V> requests have left this browser tab.{" "}
          <V c="#a855f7">{R(lc.responsePackets?.length)}</V> responses came back.
          {lc.apiCalls?.length > 0 && (
            <> Of these, <V c="#06b6d4">{lc.apiCalls.length}</V> are API calls — JavaScript requests made in the background, invisible to a normal user.</>
          )}
          {hasMedia && (
            <>
              {" "}The video player is streaming using <V c="#a855f7">adaptive bitrate</V>:
              instead of downloading the whole video, it requested{" "}
              <V c="#a855f7">{vChunks} video</V> and{" "}
              <V c="#06b6d4">{aChunks} audio</V> segments separately.
              It buffers a few seconds ahead and can switch quality depending on your connection speed.
            </>
          )}
        </>
      ),
      table: [
        { k: "Total requests",  v: R(lc.requestCount),                                           c: "#f59e0b" },
        { k: "Responses",       v: R(lc.responsePackets?.length),                                c: "#a855f7" },
        { k: "API / XHR calls", v: R(lc.apiCalls?.length),                                      c: "#06b6d4" },
        { k: "Top status codes",v: topStatus.slice(0, 3).map(([c, n]) => `${c}×${n}`).join("  ") || "—", c: "#9ca3af" },
        ...(hasMedia ? [
          { k: "Video segments", v: `${vChunks}`, c: "#a855f7" },
          { k: "Audio segments", v: `${aChunks}`, c: "#06b6d4" },
        ] : []),
      ],
    });
  }

  return steps;
}

// ═════════════════════════════════════════════════════════════════════════════
// STORY PANEL
// ═════════════════════════════════════════════════════════════════════════════
export default function StoryPanel({ sd, lc, phase, domain }) {
  const [open, setOpen] = useState(true);
  const steps = buildSteps(sd, lc, domain);

  return (
    <div style={{ background: "#0a0d12", border: "1px solid #1f2937", borderRadius: 8, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header + toggle */}
      <div style={{ padding: "10px 14px", borderBottom: open ? "1px solid #1f2937" : "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ color: "#a855f7", fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1 }}>
          CONNECTION STORY
        </span>
        {phase === "capturing" && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, color: "#10b981", fontFamily: "IBM Plex Mono" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 0.8s infinite" }} />
            LIVE
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "#374151", fontSize: 8, fontFamily: "IBM Plex Mono" }}>
          {steps.length > 0 ? `${steps.length} steps` : ""}{" "}
          <span style={{ color: "#4b5563" }}>{open ? "▲" : "▼"}</span>
        </span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {steps.length === 0 ? (
            <div style={{ padding: "0 14px", color: "#1f2937", fontSize: 9, fontFamily: "IBM Plex Mono", lineHeight: 2 }}>
              {phase === "static" ? "Analysing…" : "Run a trace to see the connection story."}
            </div>
          ) : steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 0, animation: "slideIn 0.25s" }}>
              {/* Step number + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 38, flexShrink: 0, paddingTop: 12 }}>
                <div style={{
                  width: 19, height: 19, borderRadius: "50%",
                  background: step.color + "14", border: `1px solid ${step.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ color: step.color, fontSize: 7.5, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>{step.num}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 10, marginTop: 4, background: `linear-gradient(to bottom, ${step.color}28, transparent)` }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingRight: 14, paddingBottom: 14 }}>
                <div style={{ color: step.color, fontSize: 8, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 1, paddingTop: 13, marginBottom: 6 }}>
                  {step.title}
                </div>

                {/* Plain-English explanation with embedded real values */}
                <div style={{ color: "#4b5563", fontSize: 8.5, fontFamily: "IBM Plex Mono", lineHeight: 1.8 }}>
                  {step.body}
                </div>

                {/* Real data table */}
                {step.table && <Table rows={step.table} />}

                {/* Security headers breakdown */}
                {step.secHeaders && (
                  <div style={{ background: "#080b10", border: `1px solid ${step.color}18`, borderRadius: 5, padding: "7px 10px", margin: "7px 0" }}>
                    {Object.entries(SEC_INFO).map(([key, meta]) => {
                      const present = step.secHeaders[key];
                      return (
                        <div key={key} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "3px 0", borderBottom: "1px solid #0d1117" }}>
                          <span style={{ color: present ? "#10b981" : "#ef4444", fontSize: 9, flexShrink: 0, marginTop: 1, fontFamily: "IBM Plex Mono" }}>
                            {present ? "✓" : "✗"}
                          </span>
                          <div>
                            <span style={{ color: present ? "#10b981" : "#ef4444", fontSize: 7.5, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>
                              {meta.label}{" "}
                            </span>
                            <span style={{ color: "#374151", fontSize: 7.5, fontFamily: "IBM Plex Mono" }}>
                              — {present ? meta.good : meta.bad}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {phase === "capturing" && steps.length > 0 && (
            <div style={{ padding: "0 14px 8px", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", animation: "pulse 1s infinite" }} />
              <span style={{ color: "#1f2937", fontSize: 8, fontFamily: "IBM Plex Mono" }}>live capturing…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}