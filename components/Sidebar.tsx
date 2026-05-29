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


function AgentIcon({ id, size = 20, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens") return <CameraIcon size={size} style={style} />;
  if (id === "copys")   return <CopyIcon   size={size} style={style} />;
  return                       <VideoIcon  size={size} style={style} />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat }: SidebarProps) {

  return (
    <aside
      className="dot-grid relative flex h-full w-60 shrink-0 flex-col"
      style={{
        background: "rgba(0, 8, 20, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0, 212, 255, 0.2)",
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="BEXT"
            style={{
              width: 36,
              height: 36,
              objectFit: "contain",
              filter: "invert(1) sepia(1) saturate(3) hue-rotate(175deg) brightness(1.5) drop-shadow(0 0 8px rgba(0, 212, 255, 0.7))",
            }}
          />
          <p
            className="text-sm font-bold"
            style={{
              color: "#00d4ff",
              letterSpacing: "3px",
              textShadow: "0 0 10px rgba(0,212,255,0.8)",
            }}
          >
            BEXT
          </p>
        </div>
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
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200"
              style={
                active
                  ? {
                      background: "rgba(0, 212, 255, 0.1)",
                      border: "1px solid rgba(0, 212, 255, 0.4)",
                      boxShadow: "0 0 16px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.05)",
                    }
                  : {
                      background: "rgba(0, 212, 255, 0.03)",
                      border: "1px solid rgba(0, 212, 255, 0.1)",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0, 212, 255, 0.08)",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    boxShadow: "0 0 10px rgba(0,212,255,0.15)",
                  });
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: "rgba(0, 212, 255, 0.03)",
                    border: "1px solid rgba(0, 212, 255, 0.1)",
                    boxShadow: "",
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
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-all duration-200"
          style={{
            border: "1px solid rgba(0,212,255,0.3)",
            color: "#00d4ff",
            background: "transparent",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "#00d4ff",
              color: "#000814",
              boxShadow: "0 0 16px rgba(0,212,255,0.4)",
            });
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "transparent",
              color: "#00d4ff",
              boxShadow: "",
            });
          }}
        >
          <PlusIcon />
          Nova conversa
        </button>
      </div>
    </aside>
  );
}
