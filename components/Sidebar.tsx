"use client";

import { AGENTS, AgentId } from "@/lib/agents";

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-sidebar text-gray-200">
      <div className="px-4 py-5">
        <h1 className="text-lg font-semibold">Agentes de IA</h1>
        <p className="text-xs text-gray-500">Powered by Claude</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {AGENTS.map((agent) => {
          const active = agent.id === activeAgent;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                active ? "bg-sidebarHover" : "hover:bg-sidebarHover/60"
              }`}
            >
              <span className="text-xl">{agent.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{agent.name}</span>
                <span className="block truncate text-xs text-gray-500">
                  {agent.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => onNewChat(activeAgent)}
          className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-sidebarHover"
        >
          + Nova conversa
        </button>
      </div>
    </aside>
  );
}
