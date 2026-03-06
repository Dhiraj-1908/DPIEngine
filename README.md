
# ⚡ DPI Engine

### Make the invisible internet visible.

**A full-stack educational tool that replicates ISP-level Deep Packet Inspection — in your browser.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dpi--engine.vercel.app-blue?style=for-the-badge&logo=vercel)](https://dpi-engine.vercel.app/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3%20Extension-4285F4?style=for-the-badge&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)

</div>

---

## What is DPI Engine?

When an ISP wants to monitor or block your internet traffic, they deploy a **DPI (Deep Packet Inspection) appliance** — a rack-mounted hardware box that intercepts every packet on the fiber line, reads the SNI hostname from the TLS handshake (which is always in plaintext), matches it against a policy ruleset, and drops or forwards the packet. The entire pipeline is:

```
packet arrives → hash 5-tuple → assign thread → classify by SNI → apply policy → forward / drop
```

**DPI Engine replicates this exact pipeline — at the browser layer.**

It's a 4-page tool built for networking students, developers, and anyone curious about what actually happens when you open a website. Everything that's invisible — DNS resolution, TLS handshakes, CDN routing, authentication cookies, live packet flows — is made visible in real time.

---

## Features at a Glance

| Page | What it does |
|------|-------------|
| **DPI Playground** | Batch domain analysis — flow hashing, load balancer simulation, FastPath thread assignment, TLS probing, BLOCK/FORWARD decisions |
| **IP Intelligence** | Full IP analysis — geolocation, ASN inference, VPN/proxy/Tor detection, threat scoring, GPS precision override |
| **Live Proxy** | Chrome extension that intercepts real browser traffic in real time — SNI classification, app blocking, auth detection, live packet log |
| **Network Tracer** | Trace any domain end-to-end — parallel DNS + TLS + CDN + HTTP analysis, animated 8-node graph, live capture, AI explanation |

---

## Screenshots

### 🔬 DPI Playground — Flow Hashing & Pipeline Simulation

> Analyze multiple domains simultaneously. Each domain is run through a simulated enterprise DPI pipeline: 5-tuple flow hashing → load balancer pool assignment → FastPath thread assignment → TLS probe → BLOCK or FORWARD decision. The server locations map pins each resolved IP geographically.

![DPI Playground](screenshot_dpi_playground.png)

**What you're seeing:**
- **Pipeline visualization** (top-left): Load balancer pools (LB-0, LB-1) distributing flows across FastPath threads (FP-1, FP-2, FP-3)
- **Live terminal** (right): Real-time SNI classification log — `SNI=tiktok.com app=tiktok → DROPED`, `SNI=facebook.com → FWD`
- **Server Locations map**: Geolocation of each resolved IP — the TikTok domain resolves to New Delhi via Akamai CDN
- **Flow Table** (bottom): Per-domain results with protocol, flow hash, LB-FP assignment, packet count, latency, and action badge

---

### 🌍 IP Intelligence — Geolocation, ASN & Threat Scoring

> Look up any IP address and get a complete intelligence report: physical location on a map, ISP and ASN identification, VPN/proxy/Tor/hosting detection, and a computed threat score.

![IP Intelligence](screenshot_ip_intelligence.png)

**What you're seeing:**
- **Threat Score gauge**: Score of 0 — CLEAN. Computed from `proxy (+35)`, `hosting (+15)`, `mobile (-10)` signals
- **Location map**: IP `103.87.48.113` pinned to Delhi, India at city-level zoom (orange marker = IP-based, not GPS)
- **VPN / Proxy Detection**: Four signals checked — Proxy, VPN, Tor, Hosting — all CLEAN for this residential IP
- **Location metadata**: City, region, country, ZIP, timezone, coordinates — all from ASN + IP registration data

---

### ⚡ Live Proxy Analyzer — Real-Time Browser Traffic Interception

> Connect the Chrome extension and watch every HTTP/HTTPS request your browser makes, classified by app in real time. Toggle blocking rules on/off — YouTube blocked below, showing 14 packets dropped before TCP ever connects.

![Live Proxy](screenshot_live_proxy.png)

**What you're seeing:**
- **Extension status**: Chrome Extension Connected — DPI Engine Active, intercepting via `webRequest` API
- **Stats bar**: 15 total | 1 forwarded | **14 blocked** | 0 req/min
- **App Blocking Rules**: YouTube is toggled ON (red) — all other apps ALLOWED. Two custom domains added (whatismyipaddress.com, sarkariresult.com)
- **Live Packet Log** (right): Real-time stream showing `BLOCK YOUTUBE www.youtube.com`, `BLOCK YOUTUBE i.ytimg.com` — every subdomain caught
- **Architecture**: Blocking happens via `declarativeNetRequest` rules at the browser C++ engine level — packets dropped before TCP SYN

---

### 🛡️ Network Tracer — Blocked Domain Visualization

> Trace a domain that's actively blocked by the DPI engine. The animated Canvas graph shows packets exploding at the firewall wall — downstream nodes fade to near-invisible, and the browser node pulses red.

![Network Tracer Blocked](screenshot_tracer_blocked.png)

**What you're seeing:**
- **Status banner**: `youtube.com is BLOCKED — rule: youtube — Packets dropped at browser edge before TCP connects`
- **Canvas graph**: Firewall wall appears between YOUR BROWSER and DNS RESOLVER nodes. Particles travel from the browser, hit the wall, and explode in red. All downstream nodes (TLS, CDN, Origin) are dimmed at 13% opacity.
- **Static Analysis** (bottom-left): DNS resolved `142.251.220.46 · TTL 173s`, TLS `TLS_AES_256_GCM_SHA384`, CDN `Google Global Cache`
- **Right panel**: Full DNS resolution, TLS handshake details (cipher, issuer: Google Trust Services, TCP RTT: 45.97ms, 137 SANs), CDN/HTTP analysis

---

### 🌐 Network Tracer — Live Capture Graph

> Trace an active domain with the extension connected. The 8-node graph animates in real time as packets flow through each layer of the network path — DNS resolver, TLS handshake, auth state, IP geolocation, CDN edge, origin server, packet stream.

![Network Tracer Live](screenshot_tracer_live.png)

**What you're seeing:**
- **Live counters** (top): 36 requests · 34 responses · 14 API calls · 4 media segments
- **8-node animated graph**: Bezier-curved particle system flowing through each network layer simultaneously
  - Top path: DNS Resolver → TLS Handshake → Auth State (AUTHENTICATED)
  - Bottom path: IP Geolocation (Hong Kong) → CDN/Edge (Google Global Cache) → Origin Server
- **Static Analysis** (bottom-left): `DNS 142.251.220.46 · TTL 173s · TLS TLS_AES_256_GCM_SHA384 · RTT 45.97ms · CDN Google Global Cache`
- **Live Packet Log** (bottom-right): Every response classified — image, api, POST, other — with status code and path

---

### 🤖 AI Explain — 10-Step Network Analysis Report

> After tracing a domain, click AI Explain for a full technical breakdown. The AI streams an explanation of every layer — from browser URL parsing through DNS, TCP, TLS, CDN routing, to the final server response — with actual data from your trace injected inline.

![AI Explain](screenshot_ai_explain.png)

**What you're seeing:**
- **Report header**: `youtube.com` with live badges — IP `142.251.220.46`, RTT `45.97ms`, TLS `TLSv1.3`, CDN `Google Global Cache`, HTTP `200`, Requests `67`
- **Left sidebar**: 10-step navigation — User Action, DNS, TCP, TLS, HTTP Request, CDN/LB, Backend, Packets, Rendering, Streaming, Verdict
- **Step 1 — User Action**: Explains HSTS preload check, URL parsing, DNS cache miss — using your actual trace data inline
- **Step 2 — DNS Resolution**: Full resolution chain with actual nameservers (`ns1.google.com`), A record, AAAA record, TTL, Anycast explanation
- **Streaming via SSE**: Tokens stream in from OpenRouter — explanation accumulates in Zustand store, survives page navigation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  DPI Playground │ IP Intelligence │ Live Proxy │ Network Tracer  │
│                        Zustand Global State                      │
└────────────┬────────────────────────────┬───────────────────────┘
             │ HTTPS / REST               │ chrome.runtime.sendMessage
             ▼                            ▼
┌────────────────────────┐   ┌────────────────────────────────────┐
│   FastAPI Backend      │   │   Chrome MV3 Extension             │
│   (Python 3.11)        │   │   (background.js service worker)   │
│                        │   │                                    │
│  /analyze   → DPI sim  │   │  onBeforeRequest  → classify SNI   │
│  /trace     → parallel │   │  onSendHeaders    → auth extract   │
│               DNS+TLS  │   │  onHeadersReceived→ response track │
│               +CDN+HTTP│   │  onErrorOccurred  → block detect   │
│  /ip/lookup → ip-api   │   │                                    │
│  /explain   → SSE AI   │   │  declarativeNetRequest → blocking  │
└────────────────────────┘   │  chrome.storage.local → persist    │
             │               │  keepAlive() → prevent SW death    │
             ▼               └────────────────────────────────────┘
┌────────────────────────┐
│   External Services    │
│  ip-api.com (geo/ASN)  │
│  OpenRouter (LLM/SSE)  │
└────────────────────────┘
```

### How the Chrome Extension Works

The extension is a **MV3 Service Worker** (`background.js`) that replicates ISP-level DPI at the browser layer:

Browser makes request to youtube.com
        │
        ▼
onBeforeRequest  ←  fires BEFORE DNS, before TCP SYN
  classifyHost('youtube.com') → 'youtube'
  log packet as FORWARD (seq=N), store in pendingRequests Map
        │
        ├── if rule BLOCKED → declarativeNetRequest fires (C++ engine)
        │        → ERR_BLOCKED_BY_CLIENT
        │        → onErrorOccurred: retroactively mark packet as BLOCK
        │
        └── if FORWARD →
              onSendHeaders: extract Cookie (AUTH_PATTERN regex), 
                             Authorization header, Range header (video chunks)
              onHeadersReceived: statusCode, Set-Cookie flags, Content-Type
        │
        ▼
Delta poll every 1000ms: GET_STATUS { lastSeq: N }
→ only transfer new packets (O(new) not O(total))
→ Zustand store → React UI


---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, Tailwind CSS |
| Backend | FastAPI, Python 3.11, httpx, dnspython, asyncio |
| Extension | Chrome MV3, webRequest API, declarativeNetRequest |
| Visualization | Canvas 2D API (60fps particle system), Leaflet |
| AI | OpenRouter API (SSE streaming) |
| Deployment | Vercel (frontend), Render (backend) |
| External APIs | ip-api.com (geolocation/ASN), OpenRouter |

---

## How It's Different from a VPN or Adblocker

Adblockers like uBlock Origin use the same `declarativeNetRequest` API under the hood. The difference is **purpose and visibility**:

- **Adblockers** maintain curated domain blocklists and silently block ads
- **DPI Engine** classifies traffic by application, shows you every packet in real time, detects authentication state, and explains the full network path — the goal is education, not just blocking

---

## Key Engineering Decisions

**`asyncio.gather()` for parallel analysis** — DNS, TLS, and HTTP probes run concurrently. If DNS takes 80ms, TLS 120ms, HTTP 90ms → total is 120ms, not 290ms.

**Canvas 2D over SVG** — 20+ animated particles at 60fps would cause DOM thrash in SVG. Canvas uses one draw call per frame with no DOM elements per particle.

**Delta polling over WebSocket** — Chrome MV3 service workers can be killed at any time. A WebSocket would die with the SW. Polling is resilient — each request is independent.

**Local-first optimistic UI** — Rule toggles update Zustand state immediately (0ms delay), then sync to the extension asynchronously. UI never freezes waiting for extension response.

**`aiRaw` in Zustand, not `useRef`** — `useRef` is destroyed when the component unmounts (navigation). Zustand lives outside React's component tree — the AI explanation survives navigation and is restored when you return.

**ip-api.com proxied through backend** — `ip-api.com` is HTTP-only. Browsers block mixed content (HTTPS page → HTTP fetch). The FastAPI backend makes the HTTP call server-side.

---

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- Chrome browser (for extension)


### Chrome Extension
1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

your extension is ready 

## What You Can Learn From This

By using DPI Engine you'll understand — with real data, not diagrams:

- Why **HTTPS doesn't hide which websites you visit** (SNI is plaintext)
- How **ISPs classify and throttle** specific apps without decrypting traffic
- What your browser actually does in the **50-200ms before a page loads** (DNS → TCP → TLS → HTTP)
- How **CDNs route you** to the nearest server (and why youtube.com resolves to Hong Kong)
- What **authentication cookies** your browser silently sends to Instagram, Google, and Facebook on every request
- How **video streaming** works at the packet level (adaptive bitrate, Range headers, itag classification)
- Why **JWT tokens** are not encrypted (base64-encoded, anyone can decode the payload)

---

## License

MIT — built for educational purposes.

---



**[Live Demo](https://dpi-engine.vercel.app/)** · Built by [Dhiraj Mishra](https://github.com/Dhiraj-1908)

