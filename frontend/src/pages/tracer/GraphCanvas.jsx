import { useEffect, useRef, useState } from "react";
import {
  NODE_DEFS, EDGE_DEFS, getActiveNodes,
  getNodeSublabel, getTooltipContent, statusColor,
} from "./tracerHelpers";

// X position (as fraction of canvas width) where the firewall wall sits
// Placed just after the browser node (rx ≈ 0.12) and before DNS resolver (rx ≈ 0.30)
const FIREWALL_RX = 0.21;

export default function GraphCanvas({ sd, lc, phase, isBlocked }) {
  const ref       = useRef(null);
  const anim      = useRef(null);
  const particles = useRef([]);
  const pId       = useRef(0);
  const [tooltip, setTooltip] = useState(null);

  // Keep isBlocked accessible inside the animation loop without re-registering the effect
  const isBlockedRef = useRef(isBlocked);
  useEffect(() => { isBlockedRef.current = isBlocked; }, [isBlocked]);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    function npos(id) {
      const n = NODE_DEFS.find(x => x.id === id);
      return { x: n.rx * W(), y: n.ry * H() };
    }

    function bezier(ax, ay, bx, by, edge, t) {
      if (edge.curveUp || edge.curveDown) {
        const dir = edge.curveUp ? -1 : 1;
        const amt = edge.curveUp || edge.curveDown;
        const mx  = (ax + bx) / 2;
        const my  = (ay + by) / 2 + dir * H() * amt;
        return {
          x: (1-t)*(1-t)*ax + 2*(1-t)*t*mx + t*t*bx,
          y: (1-t)*(1-t)*ay + 2*(1-t)*t*my + t*t*by,
        };
      }
      return { x: ax + (bx-ax)*t, y: ay + (by-ay)*t };
    }

    function drawEdgePath(ctx, ax, ay, bx, by, edge) {
      ctx.beginPath();
      if (edge.curveUp || edge.curveDown) {
        const dir = edge.curveUp ? -1 : 1;
        const amt = edge.curveUp || edge.curveDown;
        const mx  = (ax + bx) / 2;
        const my  = (ay + by) / 2 + dir * H() * amt;
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(mx, my, bx, by);
      } else {
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      }
    }

    function edgeLabelPos(ax, ay, bx, by, edge) {
      if (edge.curveUp || edge.curveDown) {
        const dir = edge.curveUp ? -1 : 1;
        const amt = edge.curveUp || edge.curveDown;
        const mx  = (ax + bx) / 2;
        const my  = (ay + by) / 2 + dir * H() * amt;
        const lx  = (ax + 2*mx + bx) / 4;
        const ly  = (ay + 2*my + by) / 4 + dir * 9;
        return { lx, ly };
      }
      return { lx: (ax+bx)/2, ly: (ay+by)/2 - 9 };
    }

    function spawnOn(edge) {
      const { x: ax, y: ay } = npos(edge.from);
      const { x: bx, y: by } = npos(edge.to);
      const color = NODE_DEFS.find(n => n.id === edge.to)?.color || "#a855f7";
      particles.current.push({
        id: pId.current++, edge, ax, ay, bx, by,
        progress: 0, speed: 0.007 + Math.random() * 0.005, color, done: false,
        fromBrowser: edge.from === "browser",
      });
    }

    if (sd) EDGE_DEFS.forEach((e, i) => setTimeout(() => spawnOn(e), i * 120));

    const spawnInt = setInterval(() => {
      if (phase !== "capturing" && phase !== "static") return;
      const active = getActiveNodes(sd, lc);
      EDGE_DEFS.forEach(e => {
        if (active[e.from] && active[e.to] && Math.random() < 0.2) spawnOn(e);
      });
    }, 700);

    // Flicker state for blocked firewall animation
    let flickerPhase = 0;

    function drawFirewall(t) {
      const fw = FIREWALL_RX * W();
      flickerPhase += 0.04;

      // Outer red glow column
      const glowGrad = ctx.createLinearGradient(fw - 18, 0, fw + 18, 0);
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.5, `rgba(239,68,68,${0.06 + 0.03 * Math.sin(flickerPhase)})`);
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(fw - 18, 0, 36, H());

      // Core wall line — flickering
      const lineAlpha = 0.55 + 0.2 * Math.sin(flickerPhase * 2.3);
      ctx.save();
      ctx.strokeStyle = `rgba(239,68,68,${lineAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(fw, 10);
      ctx.lineTo(fw, H() - 10);
      ctx.stroke();
      ctx.restore();

      // Shield icon at midpoint
      const midY = H() / 2;
      ctx.save();
      ctx.font = `bold 13px "IBM Plex Mono"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 12;
      ctx.fillText("⊗", fw, midY);
      ctx.restore();

      // FIREWALL label above
      ctx.save();
      ctx.font = `bold 6px "IBM Plex Mono"`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(239,68,68,${0.7 + 0.2 * Math.sin(flickerPhase)})`;
      ctx.fillText("FIREWALL", fw, midY - 18);
      ctx.fillText("DROP", fw, midY + 22);
      ctx.restore();

      // Tick marks along the wall
      for (let y = 20; y < H() - 20; y += 22) {
        if (Math.abs(y - midY) < 30) continue;
        const alpha = 0.15 + 0.1 * Math.sin(flickerPhase + y * 0.1);
        ctx.save();
        ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(fw - 4, y);
        ctx.lineTo(fw + 4, y);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawBlockedOverlay() {
      // Top-left corner badge
      const pad = 12;
      ctx.save();
      ctx.fillStyle = "rgba(239,68,68,0.08)";
      if (ctx.roundRect) ctx.roundRect(pad, H() - 36, 170, 20, 3);
      else ctx.rect(pad, H() - 36, 170, 20);
      ctx.fill();
      ctx.font = `bold 7.5px "IBM Plex Mono"`;
      ctx.textAlign = "left";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("⊗ TRAFFIC BLOCKED BY DPI ENGINE", pad + 6, H() - 22);
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W(), H());
      const blocked = isBlockedRef.current;
      const t = Date.now();

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.022)";
      ctx.lineWidth = 1; ctx.setLineDash([]);
      for (let x = 0; x < W(); x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
      for (let y = 0; y < H(); y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }

      // Draw firewall barrier before edges (so edges render over the glow)
      if (blocked) drawFirewall(t);

      const active = getActiveNodes(sd, lc);

      // Edges — all red/dimmed when blocked
      EDGE_DEFS.forEach(edge => {
        const { x: ax, y: ay } = npos(edge.from);
        const { x: bx, y: by } = npos(edge.to);

        // When blocked: only the browser→first-hop edge shows in red; rest are ghosted
        const isBrowserEdge = edge.from === "browser";
        const on = active[edge.from] && active[edge.to];

        let strokeCol, lineW;
        if (blocked) {
          if (isBrowserEdge) {
            strokeCol = "#ef444466";
            lineW = 1.5;
          } else {
            strokeCol = "#1f293730"; // very dimmed — signal doesn't get through
            lineW = 1;
          }
        } else {
          const col = NODE_DEFS.find(n => n.id === edge.to)?.color || "#6b7280";
          strokeCol = on ? col + "55" : "#1f293720";
          lineW = on ? 1.5 : 1;
        }

        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = lineW;
        ctx.setLineDash(blocked && !isBrowserEdge ? [2, 8] : (edge.dashed ? [4, 7] : []));
        drawEdgePath(ctx, ax, ay, bx, by, edge);
        ctx.stroke();
        ctx.restore();

        if (on && !blocked) {
          const col = NODE_DEFS.find(n => n.id === edge.to)?.color || "#6b7280";
          const { lx, ly } = edgeLabelPos(ax, ay, bx, by, edge);
          ctx.fillStyle = col + "99";
          ctx.font = `6.5px "IBM Plex Mono"`; ctx.textAlign = "center";
          ctx.fillText(edge.label, lx, ly);
        }
        // Show edge label for browser edges even when blocked (to show context)
        if (blocked && isBrowserEdge && on) {
          const { lx, ly } = edgeLabelPos(ax, ay, bx, by, edge);
          ctx.fillStyle = "#ef444466";
          ctx.font = `6px "IBM Plex Mono"`; ctx.textAlign = "center";
          ctx.fillText(edge.label, lx, ly);
        }
      });

      // Particles
      const fwX = FIREWALL_RX * W();
      particles.current = particles.current.filter(p => !p.done);
      particles.current.forEach(p => {
        p.progress += p.speed;

        if (blocked) {
          if (p.fromBrowser) {
            // Particle travels until it hits the firewall then "dies"
            // Compute x at current progress to see if it's past the wall
            const pos = bezier(p.ax, p.ay, p.bx, p.by, p.edge, p.progress);
            if (pos.x >= fwX - 2) {
              // Explode at wall
              ctx.save();
              ctx.shadowColor = "#ef4444";
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(fwX, pos.y, 4 + Math.random() * 3, 0, Math.PI * 2);
              ctx.fillStyle = "#ef444488";
              ctx.fill();
              ctx.restore();
              p.done = true;
              return;
            }
            // Draw red particle heading to wall
            ctx.save();
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#ef4444cc";
            ctx.fill();
            ctx.restore();
          } else {
            // Non-browser particles: don't render (signal blocked)
            p.done = true;
          }
          return;
        }

        // Normal (unblocked) particle rendering
        if (p.progress >= 1) { p.done = true; return; }
        const pos = bezier(p.ax, p.ay, p.bx, p.by, p.edge, p.progress);
        ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
        NODE_DEFS.forEach(n => {
          const np = npos(n.id);
          const dx = pos.x - np.x, dy = pos.y - np.y;
          if (Math.sqrt(dx*dx + dy*dy) < 10) {
            ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = 18;
            ctx.beginPath(); ctx.arc(np.x, np.y, 32, 0, Math.PI*2);
            ctx.strokeStyle = p.color + "30"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
          }
        });
      });

      // Nodes
      NODE_DEFS.forEach((node, ni) => {
        const { x: nx, y: ny } = npos(node.id);
        const on = active[node.id];
        const r  = 28;

        // When blocked, dim all nodes except the browser
        const isBrowserNode = node.id === "browser";
        const effectiveOn   = blocked ? isBrowserNode && on : on;
        const nodeColor     = blocked && !isBrowserNode ? node.color + "22" : node.color;

        if (effectiveOn) {
          const glowColor = isBrowserNode && blocked ? "#ef4444" : node.color;
          const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r*3.2);
          g.addColorStop(0, glowColor + "14"); g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(nx, ny, r*3.2, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI*2);
        ctx.fillStyle = "#0a0d12"; ctx.fill();

        const strokeColor = blocked
          ? (isBrowserNode ? "#ef4444" : node.color + "15")
          : (on ? node.color : node.color + "22");
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = (effectiveOn || (blocked && isBrowserNode)) ? 1.5 : 1;
        ctx.setLineDash([]); ctx.stroke();

        if (effectiveOn) {
          const pulseColor = blocked && isBrowserNode ? "#ef4444" : node.color;
          const pulse = (Math.sin(t/550 + ni) + 1) / 2;
          ctx.save(); ctx.shadowColor = pulseColor; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(nx, ny, 6 + pulse*2.5, 0, Math.PI*2);
          ctx.fillStyle = pulseColor + "cc"; ctx.fill(); ctx.restore();
        }

        // Browser node pulsing red ring when blocked
        if (blocked && isBrowserNode) {
          const pulse = (Math.sin(t/400) + 1) / 2;
          ctx.beginPath(); ctx.arc(nx, ny, r + 5 + pulse*7, 0, Math.PI*2);
          ctx.strokeStyle = "#ef4444" + "38"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
          ctx.stroke(); ctx.setLineDash([]);
        }

        if ((node.id === "browser" || node.id === "packets") && phase === "capturing" && !blocked) {
          const pulse = (Math.sin(t/400) + 1) / 2;
          ctx.beginPath(); ctx.arc(nx, ny, r + 5 + pulse*7, 0, Math.PI*2);
          ctx.strokeStyle = node.color + "28"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
          ctx.stroke(); ctx.setLineDash([]);
        }

        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = blocked && !isBrowserNode
          ? node.color + "20"
          : (on ? nodeColor : nodeColor + "38");
        ctx.font = `bold 7.5px "IBM Plex Mono"`;
        node.label.forEach((line, i) => ctx.fillText(line, nx, ny + r + 5 + i * 11));
        const sub = getNodeSublabel(node.id, sd, lc);
        if (sub && (!blocked || isBrowserNode)) {
          ctx.fillStyle = "#6b7280"; ctx.font = `6px "IBM Plex Mono"`;
          ctx.fillText(sub, nx, ny + r + 5 + node.label.length * 11 + 2);
        }
      });

      // Stats overlay (only when not blocked and data available)
      if (lc && !blocked) {
        const stats = [
          { label: "REQ",   value: lc.requestCount || 0,            color: "#f59e0b" },
          { label: "RESP",  value: lc.responsePackets?.length || 0, color: "#a855f7" },
          { label: "API",   value: lc.apiCalls?.length || 0,        color: "#06b6d4" },
          { label: "MEDIA", value: lc.chunks?.length || 0,          color: "#f97316" },
        ];
        stats.forEach((s, i) => {
          const sx = 14 + i * 66;
          ctx.fillStyle = s.color + "14"; ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(sx, 12, 58, 28, 4); else ctx.rect(sx, 12, 58, 28);
          ctx.fill();
          ctx.fillStyle = s.color; ctx.font = `bold 14px "IBM Plex Mono"`; ctx.textAlign = "center";
          ctx.fillText(s.value, sx + 29, 24);
          ctx.fillStyle = s.color + "88"; ctx.font = `6px "IBM Plex Mono"`;
          ctx.fillText(s.label, sx + 29, 36);
        });
        let sx = 14 + 4 * 66 + 8;
        Object.entries(lc.statusCodes || {}).forEach(([code, count]) => {
          const c = statusColor(parseInt(code));
          ctx.fillStyle = c + "14"; ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(sx, 12, 44, 28, 4); else ctx.rect(sx, 12, 44, 28);
          ctx.fill();
          ctx.fillStyle = c; ctx.font = `bold 11px "IBM Plex Mono"`; ctx.textAlign = "center";
          ctx.fillText(code, sx + 22, 24);
          ctx.font = `6px "IBM Plex Mono"`; ctx.fillText(`×${count}`, sx + 22, 36);
          sx += 50;
        });
      }

      // Blocked stats overlay — show DROP counter
      if (blocked && lc) {
        const sx = 14;
        ctx.fillStyle = "#ef444414"; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(sx, 12, 72, 28, 4); else ctx.rect(sx, 12, 72, 28);
        ctx.fill();
        ctx.fillStyle = "#ef4444"; ctx.font = `bold 14px "IBM Plex Mono"`; ctx.textAlign = "center";
        ctx.fillText(lc.requestCount || 0, sx + 36, 24);
        ctx.fillStyle = "#ef444488"; ctx.font = `6px "IBM Plex Mono"`;
        ctx.fillText("REQ DROPPED", sx + 36, 36);
      }

      // Bottom overlay label
      if (blocked) {
        drawBlockedOverlay();
      } else {
        ctx.fillStyle = "#1f2937"; ctx.font = `7.5px "IBM Plex Mono"`; ctx.textAlign = "center";
        ctx.fillText("hover nodes for details", W()/2, H() - 10);
      }

      anim.current = requestAnimationFrame(draw);
    }

    anim.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(anim.current);
      clearInterval(spawnInt);
      window.removeEventListener("resize", resize);
    };
  }, [sd, lc, phase]);

  function onMouseMove(e) {
    const canvas = ref.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let found = null;
    NODE_DEFS.forEach(n => {
      const nx = n.rx * canvas.offsetWidth, ny = n.ry * canvas.offsetHeight;
      if (Math.sqrt((mx-nx)**2 + (my-ny)**2) < 32) found = n;
    });
    setTooltip(found ? { node: found, x: mx, y: my } : null);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={ref}
        style={{ width: "100%", height: "100%", cursor: tooltip ? "pointer" : "default" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div style={{
          position: "absolute",
          left: Math.min(tooltip.x + 14, (ref.current?.offsetWidth || 600) - 205),
          top:  Math.max(tooltip.y - 95, 10),
          background: "#0d1117", border: `1px solid ${isBlocked ? "#ef444444" : tooltip.node.color + "44"}`,
          borderRadius: 6, padding: "10px 14px", minWidth: 175,
          pointerEvents: "none", zIndex: 20,
        }}>
          <div style={{ color: isBlocked ? "#ef4444" : tooltip.node.color, fontSize: 9, fontWeight: 700, fontFamily: "IBM Plex Mono", marginBottom: 6 }}>
            {tooltip.node.label.join(" ")}
            {isBlocked && tooltip.node.id !== "browser" && (
              <span style={{ marginLeft: 8, color: "#ef444488", fontWeight: 400 }}>unreachable</span>
            )}
          </div>
          <pre style={{ margin: 0, color: isBlocked && tooltip.node.id !== "browser" ? "#374151" : "#9ca3af", fontSize: 8.5, fontFamily: "IBM Plex Mono", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {isBlocked && tooltip.node.id !== "browser"
              ? "Traffic blocked before\nreaching this node.\n\nDisable rule in Live Proxy\nto restore connection."
              : getTooltipContent(tooltip.node.id, sd, lc)
            }
          </pre>
        </div>
      )}
    </div>
  );
}