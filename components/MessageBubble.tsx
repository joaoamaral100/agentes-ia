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
      // fallback for environments without clipboard API
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
    <div className="relative my-2">
      <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 pt-9 text-sm">
        <code className="whitespace-pre-wrap break-words">{content.trim()}</code>
      </pre>
      <button
        onClick={copy}
        className={`absolute right-2 top-2 rounded px-2.5 py-1 text-xs font-medium transition-all ${
          copied
            ? "bg-green-500/20 text-green-400"
            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
        }`}
      >
        {copied ? "Copiado! ✓" : "Copiar"}
      </button>
    </div>
  );
}

// ─── markdown renderer ────────────────────────────────────────────────────────

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
      return <strong key={i}>{seg.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser ? "bg-userbubble text-white" : "bg-transparent text-gray-100"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
