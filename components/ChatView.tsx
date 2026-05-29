"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "@/lib/agents";
import MessageBubble, { ChatMessage } from "./MessageBubble";

interface ChatViewProps {
  agent: Agent;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export default function ChatView({ agent, messages, onMessagesChange }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMessage];
    onMessagesChange(history);
    setInput("");
    setLoading(true);

    // Adiciona uma mensagem vazia do assistente que será preenchida via streaming.
    const withPlaceholder = [...history, { role: "assistant", content: "" } as ChatMessage];
    onMessagesChange(withPlaceholder);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, messages: history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Erro na requisição." }));
        onMessagesChange([
          ...history,
          { role: "assistant", content: `⚠️ ${err.error ?? "Erro desconhecido."}` },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        onMessagesChange([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      onMessagesChange([
        ...history,
        { role: "assistant", content: "⚠️ Falha de conexão com o servidor." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0;
  const lastIsEmptyAssistant =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <div className="flex h-full flex-1 flex-col bg-chatbg">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <span className="text-2xl">{agent.icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-100">{agent.name}</h2>
          <p className="text-xs text-gray-500">{agent.description}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {isEmpty ? (
            <div className="mt-20 text-center">
              <div className="mb-4 text-5xl">{agent.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-gray-200">{agent.name}</h3>
              <p className="mx-auto max-w-md text-sm text-gray-400">{agent.greeting}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {lastIsEmptyAssistant && (
                <div className="flex gap-1 px-4">
                  <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-white/15 bg-userbubble p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={agent.placeholder}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="mb-0.5 mr-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black transition-opacity disabled:opacity-30"
            aria-label="Enviar"
          >
            ↑
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-600">
          Enter envia · Shift+Enter quebra linha
        </p>
      </div>
    </div>
  );
}
