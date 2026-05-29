"use client";

import { AGENTS, AgentId } from "@/lib/agents";

// Per-agent color themes
const THEMES = {
  imagens: {
    iconBg:        "bg-gradient-to-br from-violet-500/25 to-pink-500/25",
    iconGlow:      "0 0 14px rgba(139,92,246,0.35)",
    activeBg:      "rgba(139,92,246,0.07)",
    activeBorder:  "rgba(139,92,246,0.22)",
    activeGlow:    "0 0 16px rgba(139,92,246,0.18)",
    dot:           "bg-violet-400",
    dotGlow:       "shadow-[0_0_6px_rgba(139,92,246,0.7)]",
    labelGradient: "from-violet-300 to-pink-300",
  },
  copys: {
    iconBg:        "bg-gradient-to-br from-orange-500/25 to-amber-400/25",
    iconGlow:      "0 0 14px rgba(251,146,60,0.35)",
    activeBg:      "rgba(251,146,60,0.07)",
    activeBorder:  "rgba(251,146,60,0.22)",
    activeGlow:    "0 0 16px rgba(251,146,60,0.18)",
    dot:           "bg-orange-400",
    dotGlow:       "shadow-[0_0_6px_rgba(251,146,60,0.7)]",
    labelGradient: "from-orange-300 to-amber-200",
  },
  videos: {
    iconBg:        "bg-gradient-to-br from-cyan-500/25 to-blue-600/25",
    iconGlow:      "0 0 14px rgba(6,182,212,0.35)",
    activeBg:      "rgba(6,182,212,0.07)",
    activeBorder:  "rgba(6,182,212,0.22)",
    activeGlow:    "0 0 16px rgba(6,182,212,0.18)",
    dot:           "bg-cyan-400",
    dotGlow:       "shadow-[0_0_6px_rgba(6,182,212,0.7)]",
    labelGradient: "from-cyan-300 to-blue-300",
  },
} as const;

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="dot-grid relative flex h-full w-60 shrink-0 flex-col border-r border-[#161616] bg-[#080808]">

      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="glow-pulse-anim flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 text-sm"
            style={{ boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}
          >
            ✦
          </div>
          <div>
            <p className="gradient-text text-sm font-bold tracking-tight">AGENTES IA</p>
            <p className="text-[10px] tracking-widest text-[#2e2e2e]">POWERED BY CLAUDE</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#1e1e1e] to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#2a2a2a]">
          Agentes
        </p>

        {AGENTS.map((agent) => {
          const active = agent.id === activeAgent;
          const t = THEMES[agent.id];

          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:scale-[1.01]"
              style={
                active
                  ? {
                      background: t.activeBg,
                      boxShadow: `inset 0 0 0 1px ${t.activeBorder}, ${t.activeGlow}`,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "#131313";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "";
                }
              }}
            >
              {/* Icon */}
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-200",
                  active ? t.iconBg : "bg-[#181818] group-hover:bg-[#1f1f1f]",
                ].join(" ")}
                style={active ? { boxShadow: t.iconGlow } : undefined}
              >
                {agent.icon}
              </span>

              {/* Label */}
              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block truncate text-[13px] font-medium transition-colors",
                    active
                      ? `bg-gradient-to-r ${t.labelGradient} bg-clip-text text-transparent`
                      : "text-[#666] group-hover:text-[#b0b0b0]",
                  ].join(" ")}
                >
                  {agent.name}
                </span>
                <span className="block truncate text-[11px] text-[#2e2e2e]">
                  {agent.description}
                </span>
              </span>

              {/* Active dot */}
              {active && (
                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot} ${t.dotGlow}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* New chat */}
      <div className="p-3">
        <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-[#1e1e1e] to-transparent" />
        <button
          onClick={() => onNewChat(activeAgent)}
          className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-2.5 text-[12px] font-medium text-[#444] transition-all duration-200 hover:border-[#7c3aed]/30 hover:bg-[#7c3aed]/05 hover:text-[#a78bfa]"
          style={{ transition: "all 0.2s ease" }}
        >
          <span className="text-base leading-none">+</span>
          Nova conversa
        </button>
      </div>
    </aside>
  );
}
