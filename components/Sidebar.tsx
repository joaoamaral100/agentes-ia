"use client";

import { AGENTS, AgentId } from "@/lib/agents";

// ─── SVG icons ────────────────────────────────────────────────────────────────

function CameraIcon({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}
function CopyIcon({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6" />
      <path d="M10 14l9-9" />
      <path d="M6 12h6M6 16h4" />
    </svg>
  );
}
function VideoIcon({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
      <path d="M6 9h6M6 12h8M6 15h5" />
    </svg>
  );
}
function ShirtIcon({ size = 28, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}
function HomeIcon({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21V15C9 14.45 9.45 14 10 14H14C14.55 14 15 14.45 15 15V21M9 21H15" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function AgentIcon({ id, size = 28, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")     return <CameraIcon size={size} style={style} />;
  if (id === "copys")       return <CopyIcon   size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon  size={size} style={style} />;
  return                           <VideoIcon  size={size} style={style} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeAgent: AgentId;
  view?: "home" | "chat";
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
  onGoHome?: () => void;
  onSignOut?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeAgent, view = "chat",
  onSelect, onNewChat, onGoHome, onSignOut,
  isOpen = false, onClose,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside
        className={[
          "flex h-full flex-col",
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:w-[280px] md:shrink-0 md:translate-x-0",
        ].join(" ")}
        style={{
          background: "rgba(8,12,32,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(26,37,85,0.8)",
        }}
      >
        {/* Brand + close */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <button
            onClick={onGoHome}
            style={{ background: "none", border: "none", padding: 0, cursor: onGoHome ? "pointer" : "default" }}
          >
            <span
              className="font-display text-xl font-bold tracking-[10px]"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #80c8ee 45%, #00d9ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 16px rgba(0,217,255,0.35))",
                display: "block",
              }}
            >
              JARVIS
            </span>
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md md:hidden"
            style={{ color: "rgba(160,170,192,0.5)" }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-8 mb-4 h-px" style={{ background: "rgba(26,37,85,0.8)" }} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-6">

          {/* Home nav item */}
          {onGoHome && (
            <div className="mb-4">
              <button
                onClick={onGoHome}
                className="sidebar-btn relative flex w-full items-center gap-4 rounded-lg py-3 text-left"
                style={{
                  paddingLeft: view === "home" ? "11px" : "13px",
                  paddingRight: "12px",
                  background: view === "home" ? "rgba(0,217,255,0.07)" : "transparent",
                  borderLeft: view === "home" ? "2px solid rgba(0,217,255,0.8)" : "2px solid transparent",
                  boxShadow: view === "home" ? "inset 0 0 24px rgba(0,217,255,0.04)" : "",
                  transition: "all 0.2s ease-out",
                }}
                onMouseEnter={(e) => {
                  if (view !== "home") Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0,217,255,0.05)",
                    borderLeft: "2px solid rgba(0,217,255,0.35)",
                    paddingLeft: "11px",
                    boxShadow: "inset 0 0 20px rgba(0,217,255,0.03), 0 0 12px rgba(0,217,255,0.04)",
                  });
                }}
                onMouseLeave={(e) => {
                  if (view !== "home") Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "transparent",
                    borderLeft: "2px solid transparent",
                    paddingLeft: "13px",
                    boxShadow: "",
                  });
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-lg"
                  style={{
                    width: "44px", height: "44px",
                    background: view === "home" ? "rgba(0,217,255,0.1)" : "rgba(26,31,53,0.8)",
                    border: view === "home" ? "1px solid rgba(0,217,255,0.25)" : "1px solid rgba(26,37,85,0.8)",
                    transition: "all 0.2s ease-out",
                  }}
                >
                  <HomeIcon
                    size={22}
                    style={{
                      color: view === "home" ? "#00d9ff" : "rgba(160,170,192,0.45)",
                      filter: view === "home" ? "drop-shadow(0 0 6px rgba(0,217,255,0.5))" : "none",
                      transition: "all 0.2s ease-out",
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-base font-semibold"
                    style={{ color: view === "home" ? "#e0e6ff" : "rgba(160,170,192,0.6)", transition: "color 0.2s ease-out" }}
                  >
                    Dashboard
                  </span>
                  <span className="block truncate text-[12px]" style={{ color: "rgba(160,170,192,0.3)", marginTop: "2px" }}>
                    Selecionar agente
                  </span>
                </span>
              </button>

              <div className="mx-4 mt-4 mb-2 h-px" style={{ background: "rgba(26,37,85,0.7)" }} />
            </div>
          )}

          <p
            className="mb-4 px-3 text-[10px] font-semibold tracking-[3px]"
            style={{ color: "rgba(0,217,255,0.28)", fontFamily: "monospace" }}
          >
            AGENTES
          </p>

          <div className="space-y-1">
            {AGENTS.map((agent) => {
              const active = agent.id === activeAgent && view === "chat";
              return (
                <button
                  key={agent.id}
                  onClick={() => onSelect(agent.id)}
                  className="sidebar-btn relative flex w-full items-center gap-4 rounded-lg py-3 text-left"
                  style={{
                    paddingLeft: active ? "11px" : "13px",
                    paddingRight: "12px",
                    background: active ? "rgba(0,217,255,0.07)" : "transparent",
                    borderLeft: active ? "2px solid rgba(0,217,255,0.8)" : "2px solid transparent",
                    boxShadow: active ? "inset 0 0 24px rgba(0,217,255,0.04)" : "",
                    transition: "all 0.2s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) Object.assign((e.currentTarget as HTMLElement).style, {
                      background: "rgba(0,217,255,0.05)",
                      borderLeft: "2px solid rgba(0,217,255,0.35)",
                      paddingLeft: "11px",
                      boxShadow: "inset 0 0 20px rgba(0,217,255,0.03), 0 0 12px rgba(0,217,255,0.04)",
                    });
                  }}
                  onMouseLeave={(e) => {
                    if (!active) Object.assign((e.currentTarget as HTMLElement).style, {
                      background: "transparent",
                      borderLeft: "2px solid transparent",
                      paddingLeft: "13px",
                      boxShadow: "",
                    });
                  }}
                >
                  {/* Icon container */}
                  <span
                    className="flex shrink-0 items-center justify-center rounded-lg"
                    style={{
                      width: "44px", height: "44px",
                      background: active ? "rgba(0,217,255,0.1)" : "rgba(26,31,53,0.8)",
                      border: active ? "1px solid rgba(0,217,255,0.25)" : "1px solid rgba(26,37,85,0.8)",
                      transition: "all 0.2s ease-out",
                    }}
                  >
                    <AgentIcon
                      id={agent.id}
                      size={24}
                      style={{
                        color: active ? "#00d9ff" : "rgba(160,170,192,0.45)",
                        transition: "color 0.2s ease-out",
                        filter: active ? "drop-shadow(0 0 6px rgba(0,217,255,0.5))" : "none",
                      }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-base font-semibold"
                      style={{
                        color: active ? "#e0e6ff" : "rgba(160,170,192,0.6)",
                        transition: "color 0.2s ease-out",
                        lineHeight: "1.3",
                      }}
                    >
                      {agent.name}
                    </span>
                    <span className="block truncate text-[12px]" style={{ color: "rgba(160,170,192,0.3)", marginTop: "2px" }}>
                      {agent.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 pb-8">
          <div className="mb-6 h-px" style={{ background: "rgba(26,37,85,0.8)" }} />

          <button
            onClick={() => onNewChat(activeAgent)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold"
            style={{
              border: "1px solid rgba(0,217,255,0.2)",
              color: "rgba(0,217,255,0.7)",
              background: "transparent",
              transition: "all 0.2s ease-out",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, #0066cc, #0080ff)",
              border: "1px solid transparent",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(0,128,255,0.3), 0 0 12px rgba(0,217,255,0.15)",
              transform: "translateY(-1px)",
            })}
            onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
              background: "transparent",
              border: "1px solid rgba(0,217,255,0.2)",
              color: "rgba(0,217,255,0.7)",
              boxShadow: "",
              transform: "translateY(0)",
            })}
          >
            <PlusIcon />
            Nova conversa
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                color: "rgba(160,170,192,0.3)",
                background: "transparent",
                transition: "all 0.2s ease-out",
              }}
              onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
                color: "#f87171",
                background: "rgba(239,68,68,0.06)",
              })}
              onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
                color: "rgba(160,170,192,0.3)",
                background: "transparent",
              })}
            >
              <SignOutIcon />
              Sair
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
