"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "@/lib/agents";
import MessageBubble, { ChatMessage, ImageData } from "./MessageBubble";

async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        base64: result.split(",")[1],
        mediaType: file.type || "image/jpeg",
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type UploadMode = "none" | "single-image" | "single-image+price" | "3images+copys";

interface ChatViewProps {
  agent: Agent;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export default function ChatView({ agent, messages, onMessagesChange }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [price, setPrice] = useState("");
  const [copysText, setCopysText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setUploadedImages([]);
    setPrice("");
    setCopysText("");
    setInput("");
  }, [agent.id]);

  function detectUploadMode(): UploadMode {
    if (agent.id === "videos") return "3images+copys";

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return "none";

    const text = lastAssistant.content.toLowerCase();

    if (agent.id === "imagens" && text.includes("agora manda a imagem do produto")) {
      return "single-image";
    }
    if (agent.id === "copys" && text.includes("agora manda a imagem do produto")) {
      return "single-image+price";
    }

    return "none";
  }

  const uploadMode = detectUploadMode();

  function canSend(): boolean {
    if (loading) return false;
    if (uploadMode === "single-image") return uploadedImages.length === 1;
    if (uploadMode === "single-image+price") return uploadedImages.length === 1 && price.trim().length > 0;
    if (uploadMode === "3images+copys") return uploadedImages.length === 3 && copysText.trim().length > 0;
    return input.trim().length > 0;
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, maxCount: number) {
    const files = Array.from(e.target.files ?? []).slice(0, maxCount);
    setUploadedImages(files);
  }

  async function sendMessage() {
    if (!canSend()) return;

    const imageData: ImageData[] = uploadedImages.length > 0
      ? await Promise.all(uploadedImages.map(fileToImageData))
      : [];

    let displayContent = input.trim();
    let apiText: string | undefined;

    if (uploadMode === "single-image") {
      displayContent = `[Imagem: ${uploadedImages[0].name}]`;
      apiText = "Aqui está a imagem do produto.";
    } else if (uploadMode === "single-image+price") {
      displayContent = `[Imagem: ${uploadedImages[0].name}] · Preço: ${price}`;
      apiText = `Aqui está a imagem do produto. O preço é: ${price}.`;
    } else if (uploadMode === "3images+copys") {
      displayContent = `[3 imagens enviadas]\n\n${copysText}`;
      apiText = `Aqui estão as 3 imagens do produto e os copies/roteiros:\n\n${copysText}`;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: displayContent,
      images: imageData.length > 0 ? imageData : undefined,
      apiText,
    };

    const history = [...messages, userMessage];
    onMessagesChange(history);
    setInput("");
    setUploadedImages([]);
    setPrice("");
    setCopysText("");
    setLoading(true);

    const withPlaceholder: ChatMessage[] = [...history, { role: "assistant", content: "" }];
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
        <div className="mx-auto w-full max-w-3xl space-y-2">

          {/* Upload: single image (imagens agent) */}
          {uploadMode === "single-image" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3">
              <p className="mb-2 text-xs text-gray-400">Imagem do produto</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 1)}
                className="cursor-pointer text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
              />
              {uploadedImages[0] && (
                <p className="mt-1 text-xs text-green-400">{uploadedImages[0].name} ✓</p>
              )}
            </div>
          )}

          {/* Upload: single image + price (copys agent) */}
          {uploadMode === "single-image+price" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3 space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-400">Imagem do produto</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 1)}
                  className="cursor-pointer text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
                />
                {uploadedImages[0] && (
                  <p className="mt-1 text-xs text-green-400">{uploadedImages[0].name} ✓</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">Preço do produto</p>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: R$ 89,90"
                  className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Upload: 3 images + copys textarea (videos agent) */}
          {uploadMode === "3images+copys" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3 space-y-3">
              <div>
                <p className="mb-1 text-xs text-gray-400">
                  3 imagens do produto
                  <span className={`ml-2 ${uploadedImages.length === 3 ? "text-green-400" : "text-gray-500"}`}>
                    {uploadedImages.length}/3
                  </span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageChange(e, 3)}
                  className="cursor-pointer text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
                />
                {uploadedImages.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    {uploadedImages.map((f) => f.name).join(", ")}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">3 copies / roteiros</p>
                <textarea
                  value={copysText}
                  onChange={(e) => setCopysText(e.target.value)}
                  placeholder="Cole aqui os 3 copies ou roteiros..."
                  rows={5}
                  className="w-full resize-none rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Text input for normal conversation */}
          {uploadMode === "none" && (
            <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-userbubble p-2">
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
                disabled={!canSend()}
                className="mb-0.5 mr-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black transition-opacity disabled:opacity-30"
                aria-label="Enviar"
              >
                ↑
              </button>
            </div>
          )}

          {/* Send button for upload modes */}
          {uploadMode !== "none" && (
            <button
              onClick={sendMessage}
              disabled={!canSend()}
              className="w-full rounded-xl bg-white py-2.5 text-sm font-medium text-black transition-opacity disabled:opacity-30"
            >
              Enviar
            </button>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-gray-600">
          {uploadMode === "none" ? "Enter envia · Shift+Enter quebra linha" : "Preencha todos os campos para enviar"}
        </p>
      </div>
    </div>
  );
}
