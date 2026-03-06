// ─── Shared helpers, constants, node/edge definitions ────────────────────────
export function fmt(b) {
  if (!b) return null;
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1048576).toFixed(2)}MB`;
}
export function statusColor(s) {
  if (!s) return "#6b7280";
  if (s < 300) return "#10b981";
  if (s < 400) return "#f59e0b";
  return "#ef4444";
}
export const R = (v) =>
  v != null && v !== "" && v !== undefined ? String(v) : "—";

export const NODE_DEFS = [
  { id: "browser", label: ["YOUR", "BROWSER"],   color: "#f59e0b", rx: 0.10, ry: 0.50 },
  { id: "dns",     label: ["DNS",  "RESOLVER"],  color: "#8b5cf6", rx: 0.30, ry: 0.18 },
  { id: "tls",     label: ["TLS", "HANDSHAKE"],  color: "#06b6d4", rx: 0.53, ry: 0.18 },
  { id: "auth",    label: ["AUTH", "STATE"],     color: "#10b981", rx: 0.76, ry: 0.18 },
  { id: "ipgeo",   label: ["IP", "GEOLOCATION"], color: "#f97316", rx: 0.30, ry: 0.82 },
  { id: "cdn",     label: ["CDN /", "EDGE"],     color: "#f97316", rx: 0.53, ry: 0.82 },
  { id: "origin",  label: ["ORIGIN", "SERVER"],  color: "#e11d48", rx: 0.76, ry: 0.82 },
  { id: "packets", label: ["PACKET", "STREAM"],  color: "#a855f7", rx: 0.93, ry: 0.50 },
];

// curveUp    = quadratic bezier bowing ABOVE the midpoint (positive = up)
// curveDown  = quadratic bezier bowing BELOW the midpoint (positive = down)
// offsetX/offsetY = perpendicular shift on straight lines to avoid overlap
export const EDGE_DEFS = [
  // browser → dns: shift slightly above centre so it doesn't merge with TCP+TLS arc
  { from: "browser", to: "dns",     label: "DNS Query",      dashed: false, curveUp: 0.06  },
  // browser → tls: arc higher so it clearly separates from DNS Query line
  { from: "browser", to: "tls",     label: "TCP+TLS",        dashed: true,  curveUp: 0.22  },
  // dns → tls: stays straight (horizontal, no conflict)
  { from: "dns",     to: "tls",     label: "Resolved IP",    dashed: false                 },
  // tls → auth: dashed straight (horizontal, no conflict)
  { from: "tls",     to: "auth",    label: "Secure Channel", dashed: true                  },
  // auth → packets: diagonal, no conflict
  { from: "auth",    to: "packets", label: "Auth Headers",   dashed: false                 },
  // browser → ipgeo: shift slightly below to avoid overlap with DNS Query
  { from: "browser", to: "ipgeo",   label: "IP Lookup",      dashed: false, curveDown: 0.06 },
  // ipgeo → cdn: straight horizontal bottom row
  { from: "ipgeo",   to: "cdn",     label: "Geo Route",      dashed: false                 },
  // cdn → origin: straight horizontal bottom row
  { from: "cdn",     to: "origin",  label: "Edge-Origin",    dashed: false                 },
  // origin → packets: diagonal, no conflict
  { from: "origin",  to: "packets", label: "Response",       dashed: false                 },
];

export function getActiveNodes(sd, lc) {
  return {
    browser: true,
    dns:     !!sd?.dns?.success,
    tls:     !!sd?.tls?.success,
    auth:    !!lc?.authState?.isAuthenticated || !!sd?.http?.success,
    ipgeo:   !!sd?.ip_intel?.success,
    cdn:     !!sd?.http?.success,
    origin:  !!sd?.http?.success,
    packets: !!(lc?.responsePackets?.length > 0),
  };
}

export function getNodeSublabel(id, sd, lc) {
  switch (id) {
    case "browser": return lc?.authState?.isAuthenticated ? "🔐 Auth" : "Client";
    case "dns":     return sd?.dns?.resolved_ip || null;
    case "tls":     return sd?.tls?.tls_version || null;
    case "auth":    return lc?.authState?.isAuthenticated ? "AUTHENTICATED" : (sd ? "ANONYMOUS" : null);
    case "ipgeo":   return sd?.ip_intel?.city ? `${sd.ip_intel.city}, ${sd.ip_intel.country}` : null;
    case "cdn":     return sd?.http?.cdn?.name || null;
    case "origin":  return sd?.http?.success ? `${sd.http.status_code} · ${sd.http.response_time_ms}ms` : null;
    case "packets": return lc ? `${lc.requestCount || 0} reqs` : null;
  }
  return null;
}

export function getTooltipContent(id, sd, lc) {
  switch (id) {
    case "browser": return lc
      ? `Requests: ${lc.requestCount || 0}\nResponses: ${lc.responsePackets?.length || 0}\nAuth: ${lc.authState?.isAuthenticated ? lc.authState.authType : "Anonymous"}`
      : "Your Chrome browser";
    case "dns":    return sd?.dns?.success
      ? `IP: ${sd.dns.resolved_ip}\nTTL: ${sd.dns.ttl}s\nNS: ${sd.dns.records?.NS?.[0] || "?"}\nIPv6: ${sd.dns.records?.AAAA?.[0] || "none"}`
      : "Pending...";
    case "tls":    return sd?.tls?.success
      ? `${sd.tls.tls_version}\n${sd.tls.cipher_suite}\nRTT: ${sd.tls.tcp_rtt_ms}ms\nExpires: ${sd.tls.valid_until}`
      : "Pending...";
    case "auth":   return lc?.authState?.isAuthenticated
      ? `Type: ${lc.authState.authType}\nCookies: ${lc.authState.cookies?.length || 0}`
      : "No auth detected";
    case "ipgeo":  return sd?.ip_intel?.success
      ? `${sd.ip_intel.city}, ${sd.ip_intel.country}\nISP: ${sd.ip_intel.isp}\nASN: ${sd.ip_intel.as}`
      : "Pending...";
    case "cdn":    return sd?.http?.success
      ? `${sd.http.cdn?.name || "Direct"}\n${sd.http.cdn?.evidence || ""}\nProtocol: ${sd.http.protocol}`
      : "Pending...";
    case "origin": return sd?.http?.success
      ? `Status: ${sd.http.status_code}\nServer: ${sd.http.server || "hidden"}\nResponse: ${sd.http.response_time_ms}ms`
      : "Pending...";
    case "packets": return lc
      ? `Reqs: ${lc.requestCount || 0}\nPackets: ${lc.responsePackets?.length || 0}`
      : "Waiting...";
  }
  return "";
}