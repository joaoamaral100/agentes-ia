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

// ─── CodeBlock with animated copy button ─────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  // Extract optional scene label (e.g. "CENA 1 — POV")
  const firstLine = content.trim().split("\n")[0] ?? "";
  const hasLabel = /^CENA\s+\d/i.test(firstLine);
  const label = hasLabel ? firstLine : "texto";
  const body = hasLabel ? content.trim().split("\n").slice(1).join("\n").trim() : content.trim();

  function copy() {
    const text = hasLabel ? body : content.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Detect scene number to colorize label
  const sceneMatch = label.match(/CENA\s+(\d)/i);
  const sceneColors = ["", "text-violet-400", "text-cyan-400", "text-pink-400"];
  const sceneNum = sceneMatch ? parseInt(sceneMatch[1]) : 0;
  const labelColor = sceneNum >= 1 && sceneNum <= 3 ? sceneColors[sceneNum] : "text-[#3a3a3a]";

  return (
    <div className="message-in relative my-3 overflow-hidden rounded-xl border border-[#1c1c1c] bg-[#060606] shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#141414] bg-[#0a0a0a] px-4 py-2">
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${labelColor}`}>
          {label}
        </span>
        <button
          onClick={copy}
          className={[
            "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
            copied
              ? "bg-emerald-500/15 text-emerald-400"
              : "glass text-[#555] hover:text-[#aaa]",
          ].join(" ")}
        >
          {copied ? "Copiado! ✓" : "Copiar"}
        </button>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-[#c8c8c8]">
        <code className="whitespace-pre-wrap break-words">{body}</code>
      </pre>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

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
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#e8e8e8]">
          {seg.slice(2, -2)}
        </strong>
      );
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
          className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed text-white"
          style={{
            background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
            boxShadow: "0 0 18px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {renderContent(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="message-in flex justify-start">
      <div className="max-w-[92%] text-[14px] leading-relaxed text-[#c0c0c0]">
        {renderContent(message.content)}
      </div>
    </div>
  );
}
