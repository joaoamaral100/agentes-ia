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

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon({ size = 36, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={style}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}
function CopyIcon({ size = 36, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={style}>
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6" />
      <path d="M10 14l9-9" />
      <path d="M6 12h6M6 16h4" />
    </svg>
  );
}
function VideoIcon({ size = 36, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={style}>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
      <path d="M6 9h6M6 12h8M6 15h5" />
    </svg>
  );
}
function ShirtIcon({ size = 36, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={style}>
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
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function AgentCardIcon({ id, size = 36, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")     return <CameraIcon size={size} style={style} />;
  if (id === "copys")       return <CopyIcon   size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon  size={size} style={style} />;
  return                           <VideoIcon  size={size} style={style} />;
}

// Per-agent accent palette
const ACCENTS: Record<string, { primary: string; dim: string; glow: string; bg: string; topLine: string }> = {
  imagens:       { primary: "#00d9ff", dim: "rgba(0,217,255,0.55)",  glow: "rgba(0,217,255,0.22)",  bg: "rgba(0,140,255,0.06)",  topLine: "rgba(0,217,255,0.7)" },
  copys:         { primary: "#c084fc", dim: "rgba(192,132,252,0.55)", glow: "rgba(192,132,252,0.2)", bg: "rgba(140,60,255,0.06)", topLine: "rgba(192,132,252,0.7)" },
  videos:        { primary: "#2dd4bf", dim: "rgba(45,212,191,0.55)",  glow: "rgba(45,212,191,0.2)",  bg: "rgba(0,200,180,0.06)",  topLine: "rgba(45,212,191,0.7)" },
  "mode-amaral": { primary: "#fbbf24", dim: "rgba(251,191,36,0.55)",  glow: "rgba(251,191,36,0.2)",  bg: "rgba(230,150,0,0.06)",  topLine: "rgba(251,191,36,0.7)" },
};

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, msgCount, onClick, delay }: {
  agent: Agent;
  msgCount: number;
  onClick: () => void;
  delay: number;
}) {
  const [hov, setHov] = useState(false);
  const a = ACCENTS[agent.id] ?? ACCENTS.imagens;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "18px",
        padding: "36px 32px 32px",
        background: hov ? "rgba(12,18,45,0.98)" : "rgba(10,14,39,0.82)",
        border: hov ? `1.5px solid ${a.primary}` : "1px solid rgba(26,37,85,0.85)",
        boxShadow: hov
          ? `0 28px 70px rgba(0,0,0,0.55), 0 0 60px ${a.glow}, 0 0 0 1px ${a.dim}22`
          : "0 4px 28px rgba(0,0,0,0.32)",
        transform: hov ? "translateY(-8px) scale(1.015)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        animation: `card-in 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
        display: "flex",
        flexDirection: "column",
        gap: "0",
        overflow: "hidden",
        minHeight: "260px",
      }}
    >
      {/* Accent top line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: hov
          ? `linear-gradient(90deg, transparent 0%, ${a.topLine} 40%, ${a.primary} 60%, ${a.topLine} 80%, transparent 100%)`
          : "transparent",
        transition: "opacity 0.3s ease",
        opacity: hov ? 1 : 0,
      }} />

      {/* Corner glow disc */}
      <div style={{
        position: "absolute", top: "-60px", right: "-60px",
        width: "180px", height: "180px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${a.glow} 0%, transparent 65%)`,
        opacity: hov ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }} />

      {/* Row: icon + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        {/* Icon container */}
        <div style={{
          width: "80px", height: "80px",
          borderRadius: "20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: hov ? a.bg : "rgba(16,24,52,0.8)",
          border: hov ? `1px solid ${a.dim}55` : "1px solid rgba(26,37,85,0.75)",
          boxShadow: hov ? `0 0 28px ${a.glow}` : "none",
          transition: "all 0.3s ease",
        }}>
          <AgentCardIcon
            id={agent.id}
            size={36}
            style={{
              color: hov ? a.primary : "rgba(160,170,192,0.4)",
              filter: hov ? `drop-shadow(0 0 10px ${a.primary})` : "none",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {/* Badge */}
        {msgCount > 0 ? (
          <div style={{
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            background: "rgba(0,217,255,0.07)",
            border: "1px solid rgba(0,217,255,0.18)",
            color: "rgba(0,217,255,0.65)",
          }}>
            {msgCount} msgs
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.14)",
          }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 5px rgba(34,197,94,0.7)",
            }} />
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(34,197,94,0.5)", fontFamily: "monospace" }}>
              ONLINE
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 style={{
        fontSize: "20px",
        fontWeight: 700,
        lineHeight: 1.25,
        color: hov ? "#e8eeff" : "rgba(200,215,240,0.8)",
        marginBottom: "10px",
        transition: "color 0.2s ease",
      }}>
        {agent.name}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: "13px",
        color: "rgba(160,170,192,0.45)",
        lineHeight: 1.65,
        flex: 1,
        marginBottom: "28px",
      }}>
        {agent.description}
      </p>

      {/* CTA button */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 22px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.3px",
        background: hov
          ? `linear-gradient(135deg, ${a.primary}28, ${a.primary}14)`
          : "rgba(20,28,58,0.6)",
        border: hov
          ? `1px solid ${a.dim}66`
          : "1px solid rgba(26,37,85,0.7)",
        color: hov ? a.primary : "rgba(160,170,192,0.38)",
        transition: "all 0.25s ease",
        alignSelf: "flex-start",
      }}>
        {msgCount > 0 ? "Continuar conversa" : "Iniciar conversa"}
        <ArrowIcon />
      </div>
    </div>
  );
}

// ─── Hero Home ────────────────────────────────────────────────────────────────

function HeroHome({ chats, onSelectAgent, onMenuClick }: {
  chats: ChatState;
  onSelectAgent: (id: AgentId) => void;
  onMenuClick: () => void;
}) {
  return (
    <div style={{ position: "relative", flex: 1, overflowY: "auto", background: "#0a0e27" }}>
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hero-text-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-home-a {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(55px,-40px) scale(1.07); }
          72%      { transform: translate(-30px,50px) scale(0.94); }
        }
        @keyframes orb-home-b {
          0%,100% { transform: translate(0,0) scale(1); }
          38%      { transform: translate(-65px,35px) scale(1.08); }
          68%      { transform: translate(45px,-55px) scale(0.93); }
        }
        @keyframes dot-move {
          from { background-position: 0 0; }
          to   { background-position: 28px 28px; }
        }
        @keyframes logo-pulse {
          0%,100% { filter: drop-shadow(0 0 22px rgba(0,217,255,0.4)) drop-shadow(0 0 55px rgba(0,217,255,0.12)); }
          50%      { filter: drop-shadow(0 0 36px rgba(0,217,255,0.65)) drop-shadow(0 0 80px rgba(0,217,255,0.2)); }
        }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,217,255,0.055) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        animation: "dot-move 16s linear infinite",
      }} />

      {/* Orbs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-200px", left: "-200px",
          width: "750px", height: "750px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,80,220,0.15) 0%, transparent 65%)",
          filter: "blur(100px)", animation: "orb-home-a 32s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-180px", right: "-180px",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,255,0.1) 0%, transparent 65%)",
          filter: "blur(100px)", animation: "orb-home-b 36s ease-in-out infinite",
        }} />
      </div>

      <div className="scan-line" />

      {/* Mobile header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 md:hidden"
        style={{
          background: "rgba(10,14,39,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(26,37,85,0.7)",
        }}
      >
        <button onClick={onMenuClick} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: "#a0aac0" }}>
          <HamburgerIcon />
        </button>
        <span style={{
          fontFamily: "var(--font-display), system-ui, sans-serif",
          fontSize: "15px", fontWeight: 800, letterSpacing: "8px",
          background: "linear-gradient(135deg, #fff, #80c8ee, #00d9ff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          JARVIS
        </span>
      </header>

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: "880px",
        margin: "0 auto",
        padding: "clamp(36px,5vw,72px) clamp(20px,4vw,40px) 60px",
      }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: "center", marginBottom: "clamp(48px,6vw,72px)", animation: "hero-text-in 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>

          {/* JARVIS wordmark */}
          <div style={{
            fontSize: "clamp(52px,10vw,80px)",
            fontWeight: 800,
            letterSpacing: "clamp(14px,3vw,24px)",
            lineHeight: 1,
            background: "linear-gradient(135deg, #ffffff 0%, #c8e8ff 25%, #00d9ff 58%, #00f0ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "logo-pulse 4s ease-in-out infinite",
            marginBottom: "18px",
            fontFamily: "var(--font-display), system-ui, sans-serif",
          }}>
            JARVIS
          </div>

          <p style={{
            fontSize: "clamp(14px,1.8vw,17px)",
            color: "rgba(160,170,192,0.55)",
            maxWidth: "420px",
            margin: "0 auto 24px",
            lineHeight: 1.65,
          }}>
            Plataforma de criação com IA para{" "}
            <span style={{ color: "rgba(0,217,255,0.75)", fontWeight: 600 }}>TikTok Shopping</span>
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <div style={{ height: "1px", width: "56px", background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.22))" }} />
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,217,255,0.5)", boxShadow: "0 0 6px rgba(0,217,255,0.8)" }} />
            <div style={{ height: "1px", width: "56px", background: "linear-gradient(90deg, rgba(0,217,255,0.22), transparent)" }} />
          </div>
        </div>

        {/* ── CARDS GRID 2×2 ── */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "3.5px",
            color: "rgba(0,217,255,0.25)",
            fontFamily: "monospace",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "28px",
          }}>
            SELECIONE UM AGENTE
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
          }}>
            {AGENTS.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                msgCount={chats[agent.id]?.filter(m => m.content).length ?? 0}
                onClick={() => onSelectAgent(agent.id)}
                delay={i * 90}
              />
            ))}
          </div>
        </div>

        {/* Bottom status */}
        <div style={{
          marginTop: "52px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}>
          <div className="status-online" style={{ width: "5px", height: "5px", borderRadius: "50%" }} />
          <span style={{
            fontSize: "9px",
            letterSpacing: "3px",
            color: "rgba(34,197,94,0.38)",
            fontFamily: "monospace",
            textTransform: "uppercase",
          }}>
            Sistema online · JARVIS AI © 2026
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── HomeClient ───────────────────────────────────────────────────────────────

const VIEW_KEY  = "jarvis_view";
const AGENT_KEY = "jarvis_active_agent";

export default function HomeClient() {
  const [view, setView]               = useState<View>("home");
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats]             = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatsRef                      = useRef<ChatState>(emptyState);

  // Restore persisted view + agent on mount
  useEffect(() => {
    const stored = loadChats();
    chatsRef.current = stored;
    setChats(stored);
    try {
      const savedAgent = sessionStorage.getItem(AGENT_KEY) as AgentId | null;
      const savedView  = sessionStorage.getItem(VIEW_KEY)  as View    | null;
      if (savedAgent && AGENTS.some(a => a.id === savedAgent)) setActiveAgent(savedAgent);
      if (savedView === "chat" || savedView === "home")         setView(savedView);
    } catch {}
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
    try { sessionStorage.setItem(AGENT_KEY, id); sessionStorage.setItem(VIEW_KEY, "chat"); } catch {}
  }

  function handleGoHome() {
    setView("home");
    setSidebarOpen(false);
    try { sessionStorage.setItem(VIEW_KEY, "home"); } catch {}
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
