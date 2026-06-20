"use client";

import { useEffect, useRef, useState } from "react";

// ── Custom HUD cursor ─────────────────────────────────────────────────────────
function CustomCursor() {
  const [pos,   setPos]   = useState({ x: -200, y: -200 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const idRef = useRef(0);

  useEffect(() => {
    let buf: typeof trail = [];
    function onMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY });
      buf = [...buf.slice(-7), { x: e.clientX, y: e.clientY, id: idRef.current++ }];
      setTrail([...buf]);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}>
      {/* Trail */}
      {trail.map((t, i) => (
        <div key={t.id} style={{
          position: "absolute",
          left: t.x, top: t.y,
          width: "3px", height: "3px",
          borderRadius: "50%",
          background: "#00d4ff",
          opacity: ((i + 1) / trail.length) * 0.3,
          transform: "translate(-50%,-50%)",
        }} />
      ))}
      {/* Crosshair */}
      <div style={{ position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%,-50%)", width: "20px", height: "20px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.7)", boxShadow: "0 0 6px rgba(0,212,255,0.25)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: "3px", height: "3px", borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 5px rgba(0,212,255,0.9)", transform: "translate(-50%,-50%)" }} />
        {/* Arms */}
        <div style={{ position: "absolute", top: "50%", left: "-7px",  width: "5px", height: "1px", background: "#00d4ff", opacity: 0.8, transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", top: "50%", right: "-7px", width: "5px", height: "1px", background: "#00d4ff", opacity: 0.8, transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: "-7px",    width: "1px", height: "5px", background: "#00d4ff", opacity: 0.8, transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", bottom: "-7px", width: "1px", height: "5px", background: "#00d4ff", opacity: 0.8, transform: "translateX(-50%)" }} />
      </div>
    </div>
  );
}

// ── Floating particles (canvas) ───────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.1 + 0.4,
      vy: -(Math.random() * 0.32 + 0.07),
      vx: (Math.random() - 0.5) * 0.08,
      op: Math.random() * 0.3 + 0.07,
      opD: ((Math.random() > 0.5 ? 1 : -1) * 0.0018),
    }));

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.op += p.opD;
        if (p.op > 0.45 || p.op < 0.04) p.opD *= -1;
        if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(0,212,255,${p.op.toFixed(2)})`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = "rgba(0,212,255,0.45)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }} />;
}

// ── Click glow ripple ─────────────────────────────────────────────────────────
function GlowRipple() {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const nid = useRef(0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (!el.closest("button") && !el.closest("a")) return;
      const id = nid.current++;
      setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    }
    window.addEventListener("click", onClick, { passive: true });
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9997 }}>
      {ripples.map(r => (
        <div key={r.id} style={{
          position: "absolute",
          left: r.x, top: r.y,
          transform: "translate(-50%,-50%)",
          width: "8px", height: "8px",
          borderRadius: "50%",
          border: "1.5px solid rgba(0,212,255,0.65)",
          animation: "ripple-expand 0.7s ease-out forwards",
        }} />
      ))}
    </div>
  );
}

// ── Helper: slowly cycling numeric value ──────────────────────────────────────
function useCycling(min: number, max: number, ms: number) {
  const [v, setV] = useState(() => Math.floor(Math.random() * (max - min) + min));
  useEffect(() => {
    const t = setInterval(() => {
      setV(p => Math.min(max, Math.max(min, p + Math.floor((Math.random() - 0.5) * 14))));
    }, ms);
    return () => clearInterval(t);
  }, [min, max, ms]);
  return v;
}

// ── Top-left: circular net I/O meter ─────────────────────────────────────────
function TopLeft() {
  const pct  = useCycling(22, 78, 2600);
  const r    = 17;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="hidden md:flex" style={{
      position: "fixed", top: 10, left: 10,
      pointerEvents: "none", zIndex: 50,
      alignItems: "center", gap: "8px",
      background: "rgba(0,6,16,0.72)",
      border: "1px solid rgba(0,212,255,0.1)",
      borderRadius: "8px", padding: "6px 10px",
      backdropFilter: "blur(8px)",
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r={r} fill="none"
          stroke="#00d4ff" strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ filter: "drop-shadow(0 0 3px rgba(0,212,255,0.5))", transition: "stroke-dasharray 1.8s ease" }}
        />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fill="#00d4ff" fontSize="9" fontFamily="monospace" fontWeight="700">{pct}%</text>
      </svg>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(0,212,255,0.38)", letterSpacing: "1.5px" }}>NET I/O</div>
        <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#00d4ff", marginTop: "2px" }}>
          {(pct * 0.84).toFixed(1)}<span style={{ fontSize: "8px", color: "rgba(0,212,255,0.45)", marginLeft: "2px" }}>MB/s</span>
        </div>
      </div>
    </div>
  );
}

// ── Top-right: digital clock ──────────────────────────────────────────────────
function TopRight() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    function update() {
      const n = new Date();
      setTime(n.toLocaleTimeString("pt-BR", { hour12: false }));
      setDate(n.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }));
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden md:block" style={{
      position: "fixed", top: 10, right: 10,
      pointerEvents: "none", zIndex: 50,
      background: "rgba(0,6,16,0.72)",
      border: "1px solid rgba(0,212,255,0.1)",
      borderRadius: "8px", padding: "6px 12px",
      backdropFilter: "blur(8px)",
      textAlign: "right",
    }}>
      <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 700, color: "#00d4ff", letterSpacing: "3px", lineHeight: 1.1, textShadow: "0 0 14px rgba(0,212,255,0.55)" }}>
        {time}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(0,212,255,0.35)", letterSpacing: "1.5px", marginTop: "2px" }}>
        {date}
      </div>
    </div>
  );
}

// ── Bottom-left: system version ───────────────────────────────────────────────
function BottomLeft() {
  return (
    <div className="hidden md:block" style={{
      position: "fixed", bottom: 10, left: 10,
      pointerEvents: "none", zIndex: 50,
      background: "rgba(0,6,16,0.72)",
      border: "1px solid rgba(0,212,255,0.08)",
      borderRadius: "8px", padding: "5px 10px",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(0,212,255,0.28)", letterSpacing: "2px" }}>SYSTEM</div>
      <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(0,212,255,0.5)", letterSpacing: "1px", marginTop: "2px" }}>v2.0.26 · STABLE</div>
    </div>
  );
}

// ── Bottom-right: CPU / MEM bars ──────────────────────────────────────────────
function BottomRight() {
  const cpu = useCycling(12, 52, 1700);
  const mem = useCycling(38, 72, 3100);

  function Bar({ label, value }: { label: string; value: number }) {
    const hot = value > 60;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: "8px", color: "rgba(0,212,255,0.38)", marginBottom: "3px" }}>
          <span>{label}</span>
          <span style={{ color: hot ? "#fbbf24" : "#00d4ff" }}>{value}%</span>
        </div>
        <div style={{ width: "86px", height: "3px", background: "rgba(0,212,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${value}%`,
            background: hot ? "linear-gradient(90deg,#00d4ff,#fbbf24)" : "linear-gradient(90deg,rgba(0,212,255,0.4),#00d4ff)",
            borderRadius: "2px",
            boxShadow: "0 0 4px rgba(0,212,255,0.45)",
            transition: "width 1.6s ease",
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block" style={{
      position: "fixed", bottom: 10, right: 10,
      pointerEvents: "none", zIndex: 50,
      background: "rgba(0,6,16,0.72)",
      border: "1px solid rgba(0,212,255,0.08)",
      borderRadius: "8px", padding: "7px 10px",
      backdropFilter: "blur(8px)",
      minWidth: "108px",
    }}>
      <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(0,212,255,0.28)", letterSpacing: "2px", marginBottom: "7px" }}>RESOURCES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Bar label="CPU" value={cpu} />
        <Bar label="MEM" value={mem} />
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function HudOverlay() {
  return (
    <>
      <CustomCursor />
      <Particles />
      <TopLeft />
      <TopRight />
      <BottomLeft />
      <BottomRight />
      <GlowRipple />
    </>
  );
}
