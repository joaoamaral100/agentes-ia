"use client";

import { AgentId } from "@/lib/agents";

// ─── SVG icons ────────────────────────────────────────────────────────────────

function HomeIcon({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
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
function ChatIcon({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
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
  onNewChat, onGoHome, onSignOut,
  isOpen = false, onClose,
}: SidebarProps) {

  const navItems = [
    {
      label: "Dashboard",
      desc: "Selecionar agente",
      icon: <HomeIcon size={22} />,
      active: view === "home",
      onClick: onGoHome ?? (() => {}),
    },
    {
      label: "Chat atual",
      desc: "Conversa em andamento",
      icon: <ChatIcon size={22} />,
      active: view === "chat",
      onClick: () => {},
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "flex h-full flex-col",
          "fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:w-[260px] md:shrink-0 md:translate-x-0",
        ].join(" ")}
        style={{
          background: "rgba(8,12,32,0.95)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(26,37,85,0.7)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-7 pt-8 pb-6">
          <button
            onClick={onGoHome}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "5px",
                background: "linear-gradient(135deg, #fff 0%, #80c8ee 45%, #00d9ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 14px rgba(0,217,255,0.35))",
                display: "block",
                overflow: "visible",
                whiteSpace: "nowrap",
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

        {/* Top separator */}
        <div style={{ margin: "0 28px 20px", height: "1px", background: "rgba(26,37,85,0.7)" }} />

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <p style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "rgba(0,217,255,0.25)",
            fontFamily: "monospace",
            textTransform: "uppercase",
            padding: "0 12px",
            marginBottom: "12px",
          }}>
            NAVEGAÇÃO
          </p>

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative flex w-full items-center gap-4 rounded-lg py-3 text-left"
                style={{
                  paddingLeft: item.active ? "11px" : "13px",
                  paddingRight: "12px",
                  background: item.active ? "rgba(0,217,255,0.07)" : "transparent",
                  borderLeft: item.active ? "2px solid rgba(0,217,255,0.8)" : "2px solid transparent",
                  boxShadow: item.active ? "inset 0 0 24px rgba(0,217,255,0.04)" : "",
                  transition: "all 0.2s ease-out",
                  cursor: item.active ? "default" : "pointer",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!item.active) Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0,217,255,0.04)",
                    borderLeft: "2px solid rgba(0,217,255,0.3)",
                    paddingLeft: "11px",
                  });
                }}
                onMouseLeave={(e) => {
                  if (!item.active) Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "transparent",
                    borderLeft: "2px solid transparent",
                    paddingLeft: "13px",
                  });
                }}
              >
                <span
                  style={{
                    width: "42px", height: "42px",
                    borderRadius: "11px",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: item.active ? "rgba(0,217,255,0.1)" : "rgba(20,28,58,0.7)",
                    border: item.active ? "1px solid rgba(0,217,255,0.25)" : "1px solid rgba(26,37,85,0.8)",
                    color: item.active ? "#00d9ff" : "rgba(160,170,192,0.4)",
                    filter: item.active ? "drop-shadow(0 0 6px rgba(0,217,255,0.45))" : "none",
                    transition: "all 0.2s ease-out",
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: item.active ? "#e0e6ff" : "rgba(160,170,192,0.55)",
                    lineHeight: "1.3",
                    transition: "color 0.2s ease-out",
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    display: "block",
                    fontSize: "11px",
                    color: "rgba(160,170,192,0.28)",
                    marginTop: "2px",
                  }}>
                    {item.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "0 20px 32px" }}>
          <div style={{ height: "1px", background: "rgba(26,37,85,0.7)", marginBottom: "20px" }} />

          {/* Nova conversa */}
          <button
            onClick={() => onNewChat(activeAgent)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.3px",
              border: "1px solid rgba(0,217,255,0.2)",
              color: "rgba(0,217,255,0.7)",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease-out",
            }}
            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
              background: "linear-gradient(135deg, #0066cc, #0080ff)",
              border: "1px solid transparent",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(0,128,255,0.3)",
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

          {/* Sign out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                width: "100%",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(160,170,192,0.28)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease-out",
              }}
              onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
                color: "#f87171",
                background: "rgba(239,68,68,0.06)",
              })}
              onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, {
                color: "rgba(160,170,192,0.28)",
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
