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
function ShirtIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AgentIcon({ id, size = 20, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")     return <CameraIcon size={size} style={style} />;
  if (id === "copys")       return <CopyIcon   size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon  size={size} style={style} />;
  return                           <VideoIcon  size={size} style={style} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside
        className={[
          "flex h-full flex-col",
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:w-60 md:shrink-0 md:translate-x-0",
        ].join(" ")}
        style={{
          background: "#00080f",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span
            className="text-[18px] font-bold tracking-[10px]"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #70c8f0 50%, #00d4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            JARVIS
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg md:hidden"
            style={{ color: "rgba(74,158,187,0.6)" }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className="mb-2 px-2 text-[10px] font-semibold tracking-[3px]"
            style={{ color: "rgba(74,158,187,0.4)" }}
          >
            AGENTES
          </p>

          <div className="space-y-0.5">
            {AGENTS.map((agent) => {
              const active = agent.id === activeAgent;

              return (
                <button
                  key={agent.id}
                  onClick={() => onSelect(agent.id)}
                  className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left"
                  style={
                    active
                      ? {
                          background: "rgba(0,212,255,0.07)",
                          borderLeft: "2px solid #00d4ff",
                          paddingLeft: "10px",
                          transition: "all 0.15s ease",
                        }
                      : {
                          background: "transparent",
                          borderLeft: "2px solid transparent",
                          paddingLeft: "10px",
                          transition: "all 0.15s ease",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) Object.assign((e.currentTarget as HTMLElement).style, {
                      background: "rgba(255,255,255,0.04)",
                      borderLeft: "2px solid rgba(0,212,255,0.3)",
                      paddingLeft: "10px",
                    });
                  }}
                  onMouseLeave={(e) => {
                    if (!active) Object.assign((e.currentTarget as HTMLElement).style, {
                      background: "transparent",
                      borderLeft: "2px solid transparent",
                      paddingLeft: "10px",
                    });
                  }}
                >
                  {/* Icon */}
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={
                      active
                        ? {
                            background: "rgba(0,212,255,0.12)",
                            border: "1px solid rgba(0,212,255,0.2)",
                          }
                        : { background: "rgba(255,255,255,0.04)" }
                    }
                  >
                    <AgentIcon
                      id={agent.id}
                      size={17}
                      style={{ color: active ? "#00d4ff" : "rgba(74,158,187,0.6)" }}
                    />
                  </span>

                  {/* Label */}
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-semibold"
                      style={{ color: active ? "#e8f4ff" : "rgba(180,210,230,0.6)" }}
                    >
                      {agent.name}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: "rgba(74,158,187,0.4)" }}
                    >
                      {agent.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Separator + New chat */}
        <div className="p-3 pb-4">
          <div className="mx-2 mb-3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <button
            onClick={() => onNewChat(activeAgent)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold tracking-wide"
            style={{
              border: "1px solid rgba(0,212,255,0.25)",
              color: "rgba(0,212,255,0.8)",
              background: "transparent",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, #1a44ff, #0088cc)",
              border: "1px solid transparent",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(0,100,255,0.3)",
            })}
            onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
              background: "transparent",
              border: "1px solid rgba(0,212,255,0.25)",
              color: "rgba(0,212,255,0.8)",
              boxShadow: "",
            })}
          >
            <PlusIcon />
            Nova conversa
          </button>
        </div>
      </aside>
    </>
  );
}
