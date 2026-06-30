"use client";

import { useEffect, useRef, useState } from "react";

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
        ctx.fillStyle   = `rgba(0,217,255,${p.op.toFixed(2)})`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = "rgba(0,217,255,0.4)";
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
          border: "1.5px solid rgba(0,217,255,0.6)",
          animation: "ripple-expand 0.7s ease-out forwards",
        }} />
      ))}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function HudOverlay() {
  return (
    <>
      <Particles />
      <GlowRipple />
    </>
  );
}
