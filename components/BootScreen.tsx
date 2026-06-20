"use client";

import { useEffect, useState } from "react";

const TITLE = "JARVIS SYSTEM ONLINE";
const STATUSES = [
  { text: "CONNECTING...",     color: "#00d4ff" },
  { text: "AUTHENTICATING...", color: "#00d4ff" },
  { text: "LOADING AGENTS...", color: "#00d4ff" },
  { text: "READY",             color: "#22c55e" },
] as const;

export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [title,    setTitle]  = useState("");
  const [dotIdx,   setDotIdx] = useState(-1);
  const [fading,   setFading] = useState(false);

  useEffect(() => {
    // Skip if already booted this session
    if (sessionStorage.getItem("jarvis-booted")) {
      onDone();
      return;
    }

    let cancelled = false;
    let charIdx   = 0;

    const titleTimer = setInterval(() => {
      if (cancelled) return;
      charIdx++;
      setTitle(TITLE.slice(0, charIdx));
      if (charIdx >= TITLE.length) {
        clearInterval(titleTimer);
        // Reveal status dots sequentially
        let sIdx = 0;
        const dotTimer = setInterval(() => {
          if (cancelled) return;
          setDotIdx(sIdx);
          sIdx++;
          if (sIdx >= STATUSES.length) {
            clearInterval(dotTimer);
            setTimeout(() => {
              if (cancelled) return;
              setFading(true);
              setTimeout(() => {
                if (!cancelled) {
                  sessionStorage.setItem("jarvis-booted", "1");
                  onDone();
                }
              }, 600);
            }, 380);
          }
        }, 260);
      }
    }, 42);

    return () => { cancelled = true; clearInterval(titleTimer); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "#000208",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease-out",
        userSelect: "none",
      }}
    >
      {/* CRT scanline texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px)",
      }} />

      {/* Sub-brand */}
      <div style={{
        fontFamily: "monospace", fontSize: "clamp(10px, 1.5vw, 13px)",
        letterSpacing: "10px", color: "rgba(0,212,255,0.25)",
        marginBottom: "14px", textTransform: "uppercase",
      }}>
        BEXT · PLATFORM
      </div>

      {/* Typing title */}
      <div style={{
        fontFamily: "monospace", fontSize: "clamp(18px, 3.5vw, 36px)",
        fontWeight: 700, letterSpacing: "5px",
        color: "#00d4ff",
        textShadow: "0 0 28px rgba(0,212,255,0.65), 0 0 60px rgba(0,212,255,0.2)",
        minHeight: "1.4em", marginBottom: "44px",
      }}>
        {title}
        {title.length < TITLE.length && (
          <span style={{ animation: "boot-blink 0.7s step-end infinite" }}>▊</span>
        )}
      </div>

      {/* Status dots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
        {STATUSES.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              opacity: i <= dotIdx ? 1 : 0.07,
              transition: "opacity 0.3s ease",
              fontFamily: "monospace",
              fontSize: "clamp(11px, 1.4vw, 13px)",
              letterSpacing: "2px",
              color: i <= dotIdx ? s.color : "rgba(255,255,255,0.15)",
            }}
          >
            <span style={{
              display: "inline-block",
              width: "7px", height: "7px", borderRadius: "50%",
              flexShrink: 0,
              background:  i <= dotIdx ? s.color : "rgba(255,255,255,0.1)",
              boxShadow:   i <= dotIdx ? `0 0 8px ${s.color}, 0 0 18px ${s.color}55` : "none",
              transition: "all 0.3s ease",
              animation:  i === dotIdx ? "status-pulse 1s ease-out infinite" : "none",
            }} />
            {s.text}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: "20px",
        fontFamily: "monospace", fontSize: "9px",
        color: "rgba(0,212,255,0.15)", letterSpacing: "3px",
      }}>
        JARVIS AI © 2026 · TikTok Shopping Platform
      </div>
    </div>
  );
}
