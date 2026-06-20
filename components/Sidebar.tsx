"use client";

import { AGENTS, AgentId } from "@/lib/agents";

// ─── SVG icons ────────────────────────────────────────────────────────────────

function CameraIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function CopyIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6" />
      <path d="M10 14l9-9" />
      <path d="M6 12h6M6 16h4" />
    </svg>
  );
}

function VideoIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
      <path d="M6 9h6M6 12h8M6 15h5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}


function JarvisLogo() {
  return (
    <svg width="100" height="32" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="24"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="400"
        letterSpacing="6"
        fill="#00d4ff"
        style={{ filter: "drop-shadow(0 0 10px rgba(0,212,255,1))" }}
      >
        JARVIS
      </text>
    </svg>
  );
}

function ShirtIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}

function AgentIcon({ id, size = 20, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")    return <CameraIcon size={size} style={style} />;
  if (id === "copys")      return <CopyIcon   size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon  size={size} style={style} />;
  return                          <VideoIcon  size={size} style={style} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat, isOpen = false, onClose }: SidebarProps) {

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

    <aside
      className={[
        "dot-grid flex h-full flex-col",
        "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:w-60 md:shrink-0 md:translate-x-0",
      ].join(" ")}
      style={{
        background: "rgba(0, 8, 20, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0, 212, 255, 0.2)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <JarvisLogo />
        {/* X button — mobile only */}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg md:hidden"
          style={{ color: "#4a9ebb" }}
        >
          <CloseIcon />
        </button>
      </div>

      <div
        className="mx-4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)" }}
      />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p
          className="mb-3 px-2 text-[9px] font-semibold"
          style={{ color: "#00d4ff", letterSpacing: "4px", opacity: 0.6 }}
        >
          AGENTES
        </p>

        {AGENTS.map((agent) => {
          const active = agent.id === activeAgent;
          const iconStyle: React.CSSProperties = active
            ? { color: "#00d4ff", filter: "drop-shadow(0 0 4px #00d4ff)" }
            : { color: "#4a9ebb" };

          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,102,255,0.08))",
                      border: "1px solid rgba(0,212,255,0.45)",
                      boxShadow: "0 0 20px rgba(0,212,255,0.18), inset 0 0 20px rgba(0,212,255,0.04)",
                      transform: "translateX(5px)",
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                    }
                  : {
                      background: "rgba(0,212,255,0.02)",
                      border: "1px solid rgba(0,212,255,0.08)",
                      transform: "translateX(0)",
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0,212,255,0.07)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    boxShadow: "0 0 12px rgba(0,212,255,0.12)",
                    transform: "translateX(5px)",
                    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  });
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0,212,255,0.02)",
                    border: "1px solid rgba(0,212,255,0.08)",
                    boxShadow: "",
                    transform: "translateX(0)",
                    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  });
                }
              }}
            >
              {/* Icon container */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))",
                        boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                      }
                    : { background: "rgba(0,212,255,0.06)" }
                }
              >
                <AgentIcon id={agent.id} size={18} style={iconStyle} />
              </span>

              {/* Label */}
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[13px] font-medium"
                  style={{ color: active ? "#e0f4ff" : "#4a9ebb" }}
                >
                  {agent.name}
                </span>
                <span className="block truncate text-[11px]" style={{ color: "rgba(74,158,187,0.5)" }}>
                  {agent.description}
                </span>
              </span>

              {/* Active dot */}
              {active && (
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full glow-pulse-anim"
                  style={{ background: "#00d4ff", boxShadow: "0 0 6px rgba(0,212,255,0.9)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* New chat */}
      <div className="p-3">
        <div
          className="mx-1 mb-3 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)" }}
        />
        <button
          onClick={() => onNewChat(activeAgent)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-semibold"
          style={{
            border: "1px solid rgba(0,212,255,0.35)",
            color: "#00d4ff",
            background: "rgba(0,212,255,0.03)",
            letterSpacing: "1px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, #0055ee, #00d4ff)",
              border: "1px solid transparent",
              color: "#fff",
              boxShadow: "0 0 24px rgba(0,212,255,0.45)",
              transform: "translateY(-1px)",
            });
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "rgba(0,212,255,0.03)",
              border: "1px solid rgba(0,212,255,0.35)",
              color: "#00d4ff",
              boxShadow: "",
              transform: "translateY(0)",
            });
          }}
        >
          <PlusIcon />
          Nova conversa
        </button>
      </div>
    </aside>
    </>
  );
}
