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

// ─── CenaBox — caixa visual para CENA N — [tipo] ─────────────────────────────

function CenaBox({ title, body }: { title: string; body: string }) {
  const [copied, setCopied] = useState(false);

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
      className="my-3 overflow-hidden"
      style={{
        borderRadius: "10px",
        border: "1px solid rgba(0,212,255,0.3)",
        background: "#000d1a",
        boxShadow: "0 0 20px rgba(0,212,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: "rgba(0,212,255,0.07)",
          borderBottom: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <span className="text-[13px] font-bold tracking-wide" style={{ color: "#00d4ff" }}>
          {title}
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
      <pre
        className="p-4 text-[13px] leading-relaxed"
        style={{ color: "#e0f4ff", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {body}
      </pre>
    </div>
  );
}

// ─── CodeBlock — para blocos ``` genéricos (outros agentes) ──────────────────

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = content;
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
      className="my-3 overflow-hidden"
      style={{ borderRadius: "10px", border: "1px solid rgba(0,212,255,0.15)", background: "#000d1a" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(0,212,255,0.04)", borderBottom: "1px solid rgba(0,212,255,0.15)" }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
          output
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
      <pre
        className="p-4 text-[13px] leading-relaxed"
        style={{ color: "#e0f4ff", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {content}
      </pre>
    </div>
  );
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i} style={{ color: "#e0f4ff", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

function renderPlainText(text: string, key: string) {
  const lines = text.split("\n");
  return (
    <Fragment key={key}>
      {lines.map((line, j) => (
        <Fragment key={j}>
          {renderInline(line)}
          {j < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Fragment>
  );
}

function renderContent(raw: string) {
  // ── CENA detection: line-by-line accumulation into scene buckets ──
  if (raw.includes("CENA")) {
    const lines = raw.split("\n");
    const scenes: string[] = [];
    let current = "";

    for (const line of lines) {
      if (/CENA \d+/.test(line)) {
        if (current) scenes.push(current); // flush previous bucket
        current = line + "\n";             // start new scene bucket
      } else {
        current += line + "\n";
      }
    }
    if (current) scenes.push(current); // flush last bucket

    return (
      <>
        {scenes.map((scene, i) => {
          const sceneLines = scene.split("\n");
          const title = sceneLines[0].trim();
          const body  = sceneLines.slice(1).join("\n").replace(/```[^\n]*/g, "").trim();

          // Intro text before first CENA (e.g. "Entendi! Gerando...")
          if (!/^CENA \d+/.test(title)) {
            return <Fragment key={i}>{renderPlainText(scene, String(i))}</Fragment>;
          }

          return (
            <div
              key={i}
              style={{ background: "#0a2e3a", border: "1px solid #00bcd4", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}
            >
              <div style={{ color: "#00bcd4", fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
                {title}
              </div>
              <div style={{ color: "#fff", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                {body}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(body)}
                style={{ marginTop: "12px", padding: "8px 16px", background: "#00bcd4", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Copiar
              </button>
            </div>
          );
        })}
      </>
    );
  }

  // ── Fallback: standard ``` code block rendering (for other agents) ──
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const inner = part.replace(/^```[^\n]*\n?/, "").replace(/\n?```\s*$/, "");
      return <CodeBlock key={i} content={inner} />;
    }
    return renderPlainText(part, String(i));
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
