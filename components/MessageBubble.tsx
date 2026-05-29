"use client";

import { Fragment, useState } from "react";

export interface ImageData {
  base64: string;
  mediaType: string;
  name: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  images?: ImageData[];
  apiText?: string;
}

// ─── Jarvis CodeBlock ─────────────────────────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const firstLine = content.trim().split("\n")[0] ?? "";
  const hasLabel  = /^CENA\s+\d/i.test(firstLine);
  const label     = hasLabel ? firstLine : "output";
  const body      = hasLabel
    ? content.trim().split("\n").slice(1).join("\n").trim()
    : content.trim();

  function copy() {
    navigator.clipboard.writeText(body || content.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = body || content.trim();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="message-in relative my-3 overflow-hidden"
      style={{
        borderRadius: "8px",
        border: "1px solid rgba(0,212,255,0.2)",
        background: "#000d1a",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: "rgba(0,212,255,0.05)",
          borderBottom: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "#00d4ff" }}
        >
          {label}
        </span>
        <button
          onClick={copy}
          className="rounded px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
          style={
            copied
              ? { background: "#00d4ff", color: "#000814" }
              : {
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "#00d4ff",
                  background: "transparent",
                }
          }
          onMouseEnter={(e) => {
            if (!copied) {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "#00d4ff",
                color: "#000814",
              });
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "transparent",
                color: "#00d4ff",
              });
            }
          }}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed" style={{ color: "#e0f4ff" }}>
        <code className="whitespace-pre-wrap break-words">{body || content.trim()}</code>
      </pre>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderContent(raw: string) {
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const inner = part.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
      return <CodeBlock key={i} content={inner} />;
    }
    const lines = part.split("\n");
    return (
      <Fragment key={i}>
        {lines.map((line, j) => (
          <Fragment key={j}>
            {renderInline(line)}
            {j < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i} style={{ color: "#e0f4ff", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="message-in flex justify-end">
        <div
          className="max-w-[80%] rounded-[18px] rounded-br-sm px-4 py-3 text-[14px] leading-relaxed text-white"
          style={{
            background: "linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)",
            boxShadow: "0 0 18px rgba(0,102,255,0.3), 0 0 4px rgba(0,212,255,0.2)",
          }}
        >
          {renderContent(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="message-in flex justify-start">
      <div
        className="max-w-[92%] rounded-xl px-4 py-3 text-[14px] leading-relaxed"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "#e0f4ff",
        }}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
