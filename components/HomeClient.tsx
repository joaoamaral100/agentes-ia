"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import Footer from "@/components/Footer";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, Agent, getAgent } from "@/lib/agents";
import { supabase } from "@/lib/supabase";

type ChatState = Record<AgentId, ChatMessage[]>;
type View = "home" | "chat";

const CHATS_KEY = "jarvis_chats_v2";

function loadChats(): ChatState {
  const empty = AGENTS.reduce((acc, a) => { acc[a.id] = []; return acc; }, {} as ChatState);
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return empty;
    const stored = JSON.parse(raw) as Partial<ChatState>;
    return AGENTS.reduce((acc, a) => {
      acc[a.id] = (stored[a.id] ?? []) as ChatMessage[];
      return acc;
    }, {} as ChatState);
  } catch {
    return empty;
  }
}

function saveChats(chats: ChatState) {
  try {
    const stripped = AGENTS.reduce((acc, a) => {
      acc[a.id] = chats[a.id]
        .filter((m) => !(m.role === "assistant" && m.content === ""))
        .map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.apiText ? { apiText: m.apiText } : {}),
        })) as ChatMessage[];
      return acc;
    }, {} as ChatState);
    localStorage.setItem(CHATS_KEY, JSON.stringify(stripped));
  } catch {}
}

const emptyState: ChatState = AGENTS.reduce((acc, a) => { acc[a.id] = []; return acc; }, {} as ChatState);

// ─── Agent icons (used in home cards) ────────────────────────────────────────

function CameraIcon({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={style}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}
function CopyIcon({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={style}>
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6" />
      <path d="M10 14l9-9" />
      <path d="M6 12h6M6 16h4" />
    </svg>
  );
}
function VideoIcon({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={style}>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
      <path d="M6 9h6M6 12h8M6 15h5" />
    </svg>
  );
}
function ShirtIcon({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={style}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function AgentCardIcon({ id, size = 32, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")     return <CameraIcon size={size} style={style} />;
  if (id === "copys")       return <CopyIcon   size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon  size={size} style={style} />;
  return                           <VideoIcon  size={size} style={style} />;
}

// Agent accent colors
const AGENT_ACCENT: Record<string, { primary: string; glow: string; bg: string; border: string }> = {
  imagens:      { primary: "#00d9ff", glow: "rgba(0,217,255,0.3)",  bg: "rgba(0,150,255,0.07)",  border: "rgba(0,217,255,0.25)" },
  copys:        { primary: "#a78bfa", glow: "rgba(167,139,250,0.3)", bg: "rgba(120,80,255,0.07)", border: "rgba(167,139,250,0.25)" },
  videos:       { primary: "#00f0ff", glow: "rgba(0,240,255,0.3)",  bg: "rgba(0,200,255,0.07)",  border: "rgba(0,240,255,0.25)" },
  "mode-amaral":{ primary: "#fbbf24", glow: "rgba(251,191,36,0.3)", bg: "rgba(251,150,0,0.07)",  border: "rgba(251,191,36,0.25)" },
};

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, msgCount, onClick, delay }: {
  agent: Agent;
  msgCount: number;
  onClick: () => void;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT.imagens;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "16px",
        padding: "32px 28px 28px",
        background: hovered ? "rgba(15,21,53,0.96)" : "rgba(10,14,39,0.85)",
        border: hovered
          ? `1.5px solid ${accent.primary}`
          : `1px solid rgba(26,37,85,0.9)`,
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.5), 0 0 50px ${accent.glow}, 0 0 0 1px ${accent.border}`
          : "0 4px 24px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        animation: `card-in 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflow: "hidden",
      }}
    >
      {/* Top glow when hovered */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: hovered
          ? `linear-gradient(90deg, transparent, ${accent.primary}, transparent)`
          : "transparent",
        transition: "opacity 0.3s ease",
        opacity: hovered ? 1 : 0,
      }} />

      {/* Icon + badge row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: "72px", height: "72px",
          borderRadius: "18px",
          background: hovered ? accent.bg : "rgba(20,28,58,0.8)",
          border: hovered ? `1px solid ${accent.border}` : "1px solid rgba(26,37,85,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s ease",
          boxShadow: hovered ? `0 0 24px ${accent.glow}` : "none",
        }}>
          <AgentCardIcon
            id={agent.id}
            size={32}
            style={{
              color: hovered ? accent.primary : "rgba(160,170,192,0.45)",
              filter: hovered ? `drop-shadow(0 0 8px ${accent.primary})` : "none",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {msgCount > 0 ? (
          <div style={{
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            background: "rgba(0,217,255,0.08)",
            border: "1px solid rgba(0,217,255,0.2)",
            color: "rgba(0,217,255,0.7)",
          }}>
            {msgCount} msg{msgCount !== 1 ? "s" : ""}
          </div>
        ) : (
          <div style={{
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            color: "rgba(34,197,94,0.55)",
            fontFamily: "monospace",
          }}>
            ONLINE
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: 700,
          color: hovered ? "#e0e6ff" : "rgba(200,215,240,0.85)",
          marginBottom: "8px",
          lineHeight: "1.3",
          transition: "color 0.2s ease",
        }}>
          {agent.name}
        </h3>
        <p style={{
          fontSize: "13px",
          color: "rgba(160,170,192,0.5)",
          lineHeight: "1.6",
        }}>
          {agent.description}
        </p>
      </div>

      {/* CTA */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.3px",
          background: hovered
            ? `linear-gradient(135deg, ${accent.primary}22, ${accent.primary}11)`
            : "rgba(26,31,53,0.6)",
          border: hovered
            ? `1px solid ${accent.border}`
            : "1px solid rgba(26,37,85,0.8)",
          color: hovered ? accent.primary : "rgba(160,170,192,0.4)",
          transition: "all 0.25s ease",
          alignSelf: "flex-start",
        }}
      >
        {msgCount > 0 ? "Continuar" : "Iniciar"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ─── Hero Home ────────────────────────────────────────────────────────────────

function HeroHome({ chats, onSelectAgent, onMenuClick }: {
  chats: Record<AgentId, ChatMessage[]>;
  onSelectAgent: (id: AgentId) => void;
  onMenuClick: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        overflowY: "auto",
        background: "#0a0e27",
      }}
    >
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-orb-a {
          0%, 100% { transform: translate(0,0) scale(1); }
          45%       { transform: translate(50px,-35px) scale(1.06); }
          75%       { transform: translate(-30px,45px) scale(0.95); }
        }
        @keyframes hero-orb-b {
          0%, 100% { transform: translate(0,0) scale(1); }
          40%       { transform: translate(-60px,30px) scale(1.07); }
          70%       { transform: translate(40px,-50px) scale(0.94); }
        }
        @keyframes hero-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-scroll {
          from { background-position: 0 0; }
          to   { background-position: 28px 28px; }
        }
        @keyframes title-glow {
          0%, 100% { filter: drop-shadow(0 0 24px rgba(0,217,255,0.35)) drop-shadow(0 0 60px rgba(0,217,255,0.1)); }
          50%       { filter: drop-shadow(0 0 36px rgba(0,217,255,0.6)) drop-shadow(0 0 80px rgba(0,217,255,0.18)); }
        }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,217,255,0.055) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        animation: "dot-scroll 14s linear infinite",
        zIndex: 0,
      }} />

      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-180px", left: "-180px",
          width: "720px", height: "720px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,80,220,0.16) 0%, transparent 65%)",
          filter: "blur(90px)", animation: "hero-orb-a 30s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-200px", right: "-180px",
          width: "680px", height: "680px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,217,255,0.1) 0%, transparent 65%)",
          filter: "blur(90px)", animation: "hero-orb-b 34s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "40%",
          width: "500px", height: "500px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,60,255,0.05) 0%, transparent 60%)",
          filter: "blur(70px)",
        }} />
      </div>

      {/* Scan line */}
      <div className="scan-line" />

      {/* Mobile header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 md:hidden"
        style={{
          background: "rgba(10,14,39,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(26,37,85,0.8)",
        }}
      >
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ color: "#a0aac0" }}
        >
          <HamburgerIcon />
        </button>
        <span
          className="font-display text-base font-bold tracking-[8px]"
          style={{
            background: "linear-gradient(135deg, #fff, #80c8ee, #00d9ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          JARVIS
        </span>
      </header>

      {/* Content */}
      <div
        style={{
          position: "relative", zIndex: 10,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "clamp(40px, 6vw, 80px) clamp(20px, 4vw, 40px) 60px",
        }}
      >

        {/* ── HERO TEXT ── */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(48px, 7vw, 80px)",
            animation: "hero-in 0.7s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Orbital ring decoration */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{
              position: "absolute", inset: "-32px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,217,255,0.06) 0%, transparent 65%)",
              filter: "blur(20px)",
            }} />
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "80px", height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(0,100,255,0.12), rgba(0,217,255,0.06))",
              border: "1px solid rgba(0,217,255,0.18)",
              boxShadow: "0 0 40px rgba(0,217,255,0.08), inset 0 0 24px rgba(0,217,255,0.04)",
              position: "relative",
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 10px rgba(0,217,255,0.65))" }}>
                <circle cx="12" cy="12" r="3" fill="#00d9ff" />
                <circle cx="12" cy="12" r="6" stroke="rgba(0,217,255,0.35)" strokeWidth="1" fill="none" />
                <circle cx="12" cy="12" r="10" stroke="rgba(0,217,255,0.12)" strokeWidth="0.5" fill="none" />
                <line x1="12" y1="2" x2="12" y2="6"  stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="2"  y1="12" x2="6"  y2="12" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="18" y1="12" x2="22" y2="12" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* JARVIS wordmark */}
          <div
            style={{
              fontSize: "clamp(48px, 9vw, 72px)",
              fontWeight: 800,
              letterSpacing: "clamp(12px, 2.5vw, 22px)",
              lineHeight: 1,
              background: "linear-gradient(135deg, #ffffff 0%, #c0deff 28%, #00d9ff 62%, #00f0ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "title-glow 4s ease-in-out infinite",
              marginBottom: "16px",
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            JARVIS
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(160,170,192,0.6)",
            marginBottom: "28px",
            lineHeight: 1.6,
            maxWidth: "480px",
            margin: "0 auto 28px",
          }}>
            Sua plataforma de criação para{" "}
            <span style={{ color: "rgba(0,217,255,0.7)", fontWeight: 600 }}>TikTok Shopping</span>
          </p>

          {/* Divider + stats */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "12px" }}>
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.25))" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {[
                { label: `${AGENTS.length} Agentes`, color: "rgba(0,217,255,0.5)" },
                { label: "Online", color: "rgba(34,197,94,0.6)" },
                { label: "TikTok AI", color: "rgba(160,170,192,0.35)" },
              ].map((s, i) => (
                <span key={i} style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  color: s.color,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                }}>
                  {i > 0 && <span style={{ color: "rgba(26,37,85,0.9)", marginRight: "16px" }}>·</span>}
                  {s.label}
                </span>
              ))}
            </div>
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(90deg, rgba(0,217,255,0.25), transparent)" }} />
          </div>
        </div>

        {/* ── AGENT CARDS GRID ── */}
        <div>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "rgba(0,217,255,0.28)",
            fontFamily: "monospace",
            textAlign: "center",
            marginBottom: "24px",
          }}>
            SELECIONE UM AGENTE
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {AGENTS.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                msgCount={chats[agent.id]?.filter(m => m.content).length ?? 0}
                onClick={() => onSelectAgent(agent.id)}
                delay={i * 80}
              />
            ))}
          </div>
        </div>

        {/* Bottom status bar */}
        <div style={{
          marginTop: "56px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}>
          <div className="status-online" style={{ width: "5px", height: "5px", borderRadius: "50%" }} />
          <span style={{
            fontSize: "10px",
            letterSpacing: "2.5px",
            color: "rgba(34,197,94,0.4)",
            fontFamily: "monospace",
          }}>
            SISTEMA ONLINE · JARVIS AI © 2026
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── HomeClient ───────────────────────────────────────────────────────────────

export default function HomeClient() {
  const [view, setView]               = useState<View>("home");
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats]             = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatsRef                      = useRef<ChatState>(emptyState);

  useEffect(() => {
    const stored = loadChats();
    chatsRef.current = stored;
    setChats(stored);
  }, []);

  function updateMessages(id: AgentId, messages: ChatMessage[]) {
    const next = { ...chatsRef.current, [id]: messages };
    chatsRef.current = next;
    setChats(next);
    saveChats(next);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleSelectAgent(id: AgentId) {
    setActiveAgent(id);
    setView("chat");
    setSidebarOpen(false);
  }

  function handleGoHome() {
    setView("home");
    setSidebarOpen(false);
  }

  const agent = getAgent(activeAgent)!;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeAgent={activeAgent}
        view={view}
        onSelect={handleSelectAgent}
        onNewChat={(id) => { updateMessages(id, []); setSidebarOpen(false); }}
        onGoHome={handleGoHome}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {view === "home" ? (
          <HeroHome
            chats={chats}
            onSelectAgent={handleSelectAgent}
            onMenuClick={() => setSidebarOpen(true)}
          />
        ) : (
          <>
            <ChatView
              key={activeAgent}
              agent={agent}
              messages={chats[activeAgent]}
              onMessagesChange={(msgs) => updateMessages(activeAgent, msgs)}
              onMenuClick={() => setSidebarOpen(true)}
            />
            <Footer />
          </>
        )}
      </div>
    </main>
  );
}
