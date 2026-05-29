"use client";

import { Fragment } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Renderizador de markdown minimalista: trata blocos de código (```),
 * negrito (**texto**) e quebras de linha. Mantém o app sem dependências extras.
 */
function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const inner = part.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
      return (
        <pre
          key={i}
          className="my-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-sm"
        >
          <code>{inner.trim()}</code>
        </pre>
      );
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
