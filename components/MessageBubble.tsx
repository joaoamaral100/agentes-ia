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

// ─── Mini agent icons (used for assistant avatar) ─────────────────────────────

function CameraIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
    </svg>
  );
}
function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6M10 14l9-9" />
    </svg>
  );
}
function VideoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ShirtIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}
function AgentAvatar({ agentId }: { agentId?: string }) {
  const icon =
    agentId === "imagens"     ? <CameraIcon /> :
    agentId === "copys"       ? <CopyIcon />   :
    agentId === "mode-amaral" ? <ShirtIcon />  :
                                <VideoIcon />;
  return (
    <div
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
      style={{
        background: "linear-gradient(135deg, rgba(0,212,255,0.14), rgba(0,102,255,0.1))",
        border: "1px solid rgba(0,212,255,0.18)",
        color: "#00d4ff",
      }}
    >
      {icon}
    </div>
  );
}

// ─── CenaBox ──────────────────────────────────────────────────────────────────

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
        border: "1px solid rgba(0,212,255,0.22)",
        background: "rgba(0,10,24,0.9)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "rgba(0,212,255,0.06)", borderBottom: "1px solid rgba(0,212,255,0.12)" }}
      >
        <span className="text-[13px] font-bold tracking-wide" style={{ color: "#00d4ff" }}>{title}</span>
        <button
          onClick={copy}
          className="rounded-md px-3 py-1 text-[12px] font-semibold"
          style={{
            transition: "all 0.15s ease-out",
            ...(copied
              ? { background: "#00d4ff", color: "#000814" }
              : { border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff", background: "transparent" }),
          }}
          onMouseEnter={(e) => { if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "#00d4ff", color: "#000814" }); }}
          onMouseLeave={(e) => { if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }); }}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed" style={{ color: "#ddeeff", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {body}
      </pre>
    </div>
  );
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

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
      style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,10,24,0.9)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.6)" }}>output</span>
        <button
          onClick={copy}
          className="rounded-md px-3 py-1 text-[12px] font-semibold"
          style={{
            transition: "all 0.15s ease-out",
            ...(copied
              ? { background: "#00d4ff", color: "#000814" }
              : { border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff", background: "transparent" }),
          }}
          onMouseEnter={(e) => { if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "#00d4ff", color: "#000814" }); }}
          onMouseLeave={(e) => { if (!copied) Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }); }}
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed" style={{ color: "#ddeeff", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {content}
      </pre>
    </div>
  );
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i} style={{ color: "#e8f4ff", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>;
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
  if (raw.includes("CENA") || raw.includes("FORMATO")) {
    type Seg =
      | { type: "text";    content: string }
      | { type: "formato"; title: string }
      | { type: "cena";    title: string; body: string };

    const segments: Seg[] = [];
    let mode: "text" | "cena" = "text";
    let buffer = "";
    let cenaTitle = "";

    const flush = () => {
      if (mode === "cena" && cenaTitle) {
        const body = buffer.replace(/```[^\n]*/g, "").trim();
        segments.push({ type: "cena", title: cenaTitle, body });
      } else {
        const cleaned = buffer.replace(/```[^\n]*/g, "").trim();
        if (cleaned) segments.push({ type: "text", content: cleaned });
      }
      buffer = "";
      cenaTitle = "";
      mode = "text";
    };

    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (/^FORMATO [A-Z]/.test(t)) {
        flush();
        segments.push({ type: "formato", title: t });
      } else if (/^CENA \d+/.test(t)) {
        flush();
        mode = "cena";
        cenaTitle = t;
      } else {
        buffer += line + "\n";
      }
    }
    flush();

    return (
      <>
        {segments.map((seg, i) => {
          if (seg.type === "formato") {
            return (
              <div
                key={i}
                className="mt-5 mb-1 text-[11px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(0,212,255,0.7)", borderBottom: "1px solid rgba(0,212,255,0.12)", paddingBottom: "6px" }}
              >
                {seg.title}
              </div>
            );
          }
          if (seg.type === "cena") return <CenaBox key={i} title={seg.title} body={seg.body} />;
          return <Fragment key={i}>{renderPlainText(seg.content, String(i))}</Fragment>;
        })}
      </>
    );
  }

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

export default function MessageBubble({ message, agentId, isStreaming, animDelay }: { message: ChatMessage; agentId?: string; isStreaming?: boolean; animDelay?: number }) {
  const isUser = message.role === "user";

  if (isUser) {
    const hasImages = message.images && message.images.length > 0;
    const hasText   = message.content.trim().length > 0;
    return (
      <div className="message-in flex justify-end" style={animDelay ? { animationDelay: `${animDelay}ms` } : undefined}>
        <div
          className="max-w-[80%] rounded-[18px] rounded-br-sm text-[14px] leading-relaxed text-white"
          style={{
            background: "linear-gradient(145deg, #0c307a 0%, #0a52a8 100%)",
            boxShadow: "0 2px 16px rgba(0,40,140,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            padding: hasImages ? "10px" : "14px 20px",
          }}
        >
          {hasImages && (
            <div className={["flex flex-wrap gap-2", hasText ? "mb-2.5" : ""].join(" ")}>
              {message.images!.map((img, i) => (
                <img
                  key={i}
                  src={`data:${img.mediaType};base64,${img.base64}`}
                  alt={img.name}
                  style={{
                    maxWidth: "280px",
                    maxHeight: "200px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.15)",
                    display: "block",
                  }}
                />
              ))}
            </div>
          )}
          {hasText && (
            <div style={hasImages ? { padding: "0 4px" } : undefined}>
              {renderContent(message.content)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="message-in flex items-start gap-2.5 justify-start" style={animDelay ? { animationDelay: `${animDelay}ms` } : undefined}>
      <AgentAvatar agentId={agentId} />
      <div
        className="max-w-[88%] rounded-xl px-5 py-4 text-[14px] leading-relaxed"
        style={{
          background: "rgba(4,12,28,0.65)",
          border: "1px solid rgba(255,255,255,0.05)",
          color: "#d8ecff",
        }}
      >
        {renderContent(message.content)}
        {isStreaming && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "2px",
              height: "14px",
              background: "#00d4ff",
              marginLeft: "3px",
              verticalAlign: "middle",
              borderRadius: "1px",
              animation: "boot-blink 0.75s step-end infinite",
              boxShadow: "0 0 6px rgba(0,212,255,0.7)",
            }}
          />
        )}
      </div>
    </div>
  );
}
