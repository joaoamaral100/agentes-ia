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

// ─── CodeBlock with copy button ───────────────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = content.trim();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative my-3 overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#060606]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0d0d0d] px-4 py-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#3a3a3a]">
          texto
        </span>
        <button
          onClick={copy}
          className={[
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
            copied
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-[#1a1a1a] text-[#666666] hover:bg-[#242424] hover:text-[#aaaaaa]",
          ].join(" ")}
        >
          {copied ? "Copiado! ✓" : "Copiar"}
        </button>
      </div>

      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-[13px] font-mono leading-relaxed text-[#d4d4d4]">
        <code className="whitespace-pre-wrap break-words">{content.trim()}</code>
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
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-user-bubble px-4 py-3 text-[14px] leading-relaxed text-white shadow-accent-sm">
          {renderContent(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] text-[14px] leading-relaxed text-[#c8c8c8]">
        {renderContent(message.content)}
      </div>
    </div>
  );
}
