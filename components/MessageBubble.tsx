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

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const lines    = content.trim().split("\n");
  const firstLine = lines[0] ?? "";
  const isCena   = /^CENA\s+\d/i.test(firstLine);
  const label    = isCena ? firstLine.trim() : "output";
  const body     = isCena ? lines.slice(1).join("\n").trim() : content.trim();

  function copy() {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = body;
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
      className="message-in my-3 overflow-hidden"
      style={{
        borderRadius: "10px",
        border: isCena ? "1px solid rgba(0,212,255,0.3)" : "1px solid rgba(0,212,255,0.15)",
        background: "#000d1a",
        boxShadow: isCena ? "0 0 20px rgba(0,212,255,0.06)" : undefined,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: isCena ? "rgba(0,212,255,0.07)" : "rgba(0,212,255,0.04)",
          borderBottom: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <span
          className={isCena ? "text-[13px] font-bold tracking-wide" : "text-[11px] font-semibold uppercase tracking-widest"}
          style={{ color: "#00d4ff" }}
        >
          {label}
        </span>
        <button
          onClick={copy}
          className="rounded-md px-3 py-1 text-[12px] font-semibold transition-all duration-150"
          style={
            copied
              ? { background: "#00d4ff", color: "#000814" }
              : { border: "1px solid rgba(0,212,255,0.35)", color: "#00d4ff", background: "transparent" }
          }
          onMouseEnter={(e) => {
            if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "#00d4ff", color: "#000814" });
          }}
          onMouseLeave={(e) => {
            if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)" });
          }}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>

      {/* Body */}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed" style={{ color: "#e0f4ff", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {body}
      </pre>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderText(text: string, keyPrefix: string) {
  const lines = text.split("\n");
  return (
    <Fragment key={keyPrefix}>
      {lines.map((line, j) => (
        <Fragment key={j}>
          {renderInline(line)}
          {j < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Fragment>
  );
}

function extractInner(raw: string) {
  return raw
    .replace(/^```[^\n]*\n?/, "")   // remove opening fence + optional language hint
    .replace(/\n?```\s*$/, "");      // remove closing fence (tolerates trailing whitespace/newline)
}

function renderContent(raw: string) {
  // Split on complete code blocks first
  const parts = raw.split(/(```[\s\S]*?```)/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith("```")) {
      // Complete, closed code block
      elements.push(<CodeBlock key={i} content={extractInner(part)} />);
    } else {
      // Check for an unclosed code block within this segment
      // (happens when streaming hasn't finished or model omits closing ```)
      const fenceIdx = part.indexOf("```");
      if (fenceIdx !== -1) {
        const before = part.slice(0, fenceIdx);
        const unclosed = part.slice(fenceIdx);
        if (before.trim()) elements.push(renderText(before, `${i}-before`));
        elements.push(<CodeBlock key={`${i}-open`} content={extractInner(unclosed)} />);
      } else {
        if (part) elements.push(renderText(part, String(i)));
      }
    }
  }

  return elements;
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
