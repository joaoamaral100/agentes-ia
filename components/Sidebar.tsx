"use client";

import { AGENTS, AgentId } from "@/lib/agents";

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0d0d0d]">

      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600/15 text-sm text-violet-400 accent-glow-pulse">
            ✦
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[#f0f0f0]">Agentes de IA</p>
            <p className="text-[10px] tracking-wide text-[#3d3d3d]">Powered by Claude</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-[#1a1a1a]" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-[#333333]">
          Agentes
        </p>

        {AGENTS.map((agent) => {
          const active = agent.id === activeAgent;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                active
                  ? "bg-violet-600/10 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.18)]"
                  : "hover:bg-[#181818]",
              ].join(" ")}
            >
              {/* Icon */}
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-200",
                  active
                    ? "bg-violet-600/18 shadow-[0_0_12px_rgba(124,58,237,0.22)]"
                    : "bg-[#1c1c1c] group-hover:bg-[#242424]",
                ].join(" ")}
              >
                {agent.icon}
              </span>

              {/* Label */}
              <span className="min-w-0 flex-1">
                <span
                  className={[
                    "block truncate text-[13px] font-medium transition-colors",
                    active ? "text-[#f0f0f0]" : "text-[#888888] group-hover:text-[#cccccc]",
                  ].join(" ")}
                >
                  {agent.name}
                </span>
                <span className="block truncate text-[11px] text-[#3d3d3d]">
                  {agent.description}
                </span>
              </span>

              {/* Active indicator */}
              {active && (
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(124,58,237,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* New chat */}
      <div className="p-3">
        <div className="mx-1 mb-3 h-px bg-[#1a1a1a]" />
        <button
          onClick={() => onNewChat(activeAgent)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#222222] bg-[#111111] px-3 py-2.5 text-[13px] text-[#555555] transition-all duration-200 hover:border-[#2d2d2d] hover:bg-[#181818] hover:text-[#aaaaaa]"
        >
          <span className="text-base leading-none text-[#444444]">+</span>
          Nova conversa
        </button>
      </div>
    </aside>
  );
}
