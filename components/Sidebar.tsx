"use client";

import { useState } from "react";
import { AGENTS, AgentId } from "@/lib/agents";

interface SidebarProps {
  activeAgent: AgentId;
  onSelect: (id: AgentId) => void;
  onNewChat: (id: AgentId) => void;
}

export default function Sidebar({ activeAgent, onSelect, onNewChat }: SidebarProps) {
  const [logoError, setLogoError] = useState(false);

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
          {!logoError ? (
            <img
              src="/logo.jpg"
              alt="BEXT"
              width={32}
              height={32}
              onError={() => setLogoError(true)}
              className="glow-pulse-anim h-8 w-8 shrink-0 rounded-lg object-contain"
              style={{
                filter: "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(180deg)",
              }}
            />
          ) : (
            <div
              className="glow-pulse-anim flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
              style={{
                color: "#00d4ff",
                border: "1px solid rgba(0,212,255,0.4)",
                background: "rgba(0,212,255,0.08)",
                textShadow: "0 0 10px rgba(0,212,255,0.8)",
              }}
            >
              B
            </div>
          )}
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
              {/* Icon */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-all"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))",
                        boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                      }
                    : { background: "rgba(0,212,255,0.06)" }
                }
              >
                {agent.icon}
              </span>

              {/* Label */}
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[13px] font-medium"
                  style={{ color: active ? "#e0f4ff" : "#4a9ebb" }}
                >
                  {agent.name}
                </span>
                <span
                  className="block truncate text-[11px]"
                  style={{ color: "rgba(74,158,187,0.5)" }}
                >
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-all duration-200"
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
          <span className="text-base leading-none">+</span>
          Nova conversa
        </button>
      </div>
    </aside>
  );
}
