"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "@/lib/agents";
import MessageBubble, { ChatMessage, ImageData } from "./MessageBubble";

// ─── constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.gif,.webp";
const MAX_MB = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type))
    return "Formato inválido. Use JPG, PNG, GIF ou WebP.";
  if (file.size > MAX_MB * 1024 * 1024)
    return `Imagem muito grande. Máximo ${MAX_MB} MB.`;
  return null;
}

async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mediaType: file.type, name: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  label,
  file,
  error,
  onFile,
}: {
  label: string;
  file: File | null;
  error: string | null;
  onFile: (file: File, error: string | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function process(f: File) {
    onFile(f, validateImage(f));
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) process(f);
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) process(f);
    e.target.value = "";
  }

  const isValid = file !== null && error === null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#444444]">{label}</p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer select-none rounded-xl border border-dashed p-5 text-center transition-all duration-200",
          dragging
            ? "scale-[1.02] border-violet-500/60 bg-violet-600/8 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
            : isValid
            ? "border-emerald-500/35 bg-emerald-600/5"
            : error
            ? "border-red-500/35 bg-red-600/5"
            : "border-[#242424] bg-[#0f0f0f] hover:border-violet-600/30 hover:bg-violet-600/4",
        ].join(" ")}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={onChange} />

        {dragging ? (
          <p className="text-sm text-violet-300">Solte aqui...</p>
        ) : isValid ? (
          <div className="space-y-1">
            <p className="truncate text-[13px] font-medium text-emerald-400">✓ {file!.name}</p>
            <p className="text-[11px] text-[#444444]">{formatSize(file!.size)}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#3a3a3a]">
              ↑
            </div>
            <p className="text-[13px] text-[#555555]">
              Arraste ou <span className="text-[#888888] underline decoration-dotted">escolha</span>
            </p>
            <p className="text-[11px] text-[#333333]">JPG · PNG · GIF · WebP · máx {MAX_MB} MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ─── types ───────────────────────────────────────────────────────────────────

type UploadMode = "none" | "single-image" | "single-image+price" | "3images+copys";

interface ChatViewProps {
  agent: Agent;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export default function ChatView({ agent, messages, onMessagesChange }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<(File | null)[]>([null, null, null]);
  const [imageErrors, setImageErrors] = useState<(string | null)[]>([null, null, null]);
  const [price, setPrice] = useState("");
  const [copysText, setCopysText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    resetUpload();
    setInput("");
  }, [agent.id]);

  function resetUpload() {
    setImages([null, null, null]);
    setImageErrors([null, null, null]);
    setPrice("");
    setCopysText("");
  }

  function handleImageAt(index: number, file: File, error: string | null) {
    setImages((prev) => { const n = [...prev]; n[index] = file; return n; });
    setImageErrors((prev) => { const n = [...prev]; n[index] = error; return n; });
  }

  // ── upload mode ───────────────────────────────────────────────────────────

  function detectUploadMode(): UploadMode {
    if (agent.id === "videos") return "3images+copys";
    if (messages.length === 0) {
      if (agent.id === "imagens") return "single-image";
      if (agent.id === "copys") return "single-image+price";
    }
    return "none";
  }

  const uploadMode = detectUploadMode();
  const validImages = images.filter((f, i) => f !== null && imageErrors[i] === null) as File[];

  // ── can send ─────────────────────────────────────────────────────────────

  function canSend(): boolean {
    if (loading) return false;
    if (uploadMode === "single-image") return validImages.length >= 1;
    if (uploadMode === "single-image+price") return validImages.length >= 1 && price.trim().length > 0;
    if (uploadMode === "3images+copys") return validImages.length === 3 && copysText.trim().length > 0;
    return input.trim().length > 0;
  }

  // ── send ─────────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!canSend()) return;

    const imagesToSend = uploadMode === "3images+copys" ? validImages : validImages.slice(0, 1);

    let imageData: ImageData[] = [];
    try {
      imageData = imagesToSend.length > 0
        ? await Promise.all(imagesToSend.map(fileToImageData))
        : [];
    } catch {
      onMessagesChange([
        ...messages,
        { role: "assistant", content: "⚠️ Erro ao processar a imagem. Tente novamente." },
      ]);
      return;
    }

    let displayContent = input.trim();
    let apiText: string | undefined;

    if (uploadMode === "single-image") {
      displayContent = `[Imagem: ${imagesToSend[0].name} · ${formatSize(imagesToSend[0].size)}]`;
      apiText = "Aqui está a imagem do produto.";
    } else if (uploadMode === "single-image+price") {
      displayContent = `[Imagem: ${imagesToSend[0].name} · ${formatSize(imagesToSend[0].size)}] · Preço: ${price}`;
      apiText = `Aqui está a imagem do produto. O preço é: ${price}.`;
    } else if (uploadMode === "3images+copys") {
      displayContent = `[${imagesToSend.length} imagens enviadas]\n\n${copysText}`;
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
    resetUpload();
    setLoading(true);

    onMessagesChange([...history, { role: "assistant", content: "" }]);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha de conexão com o servidor.";
      onMessagesChange([...history, { role: "assistant", content: `⚠️ ${msg}` }]);
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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-1 flex-col bg-[#0a0a0a]">

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#141414] bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600/12 text-xl shadow-[0_0_12px_rgba(124,58,237,0.18)]">
          {agent.icon}
        </div>
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-[#f0f0f0]">{agent.name}</h2>
          <p className="text-[11px] text-[#3d3d3d]">{agent.description}</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-5 py-8">
          {isEmpty ? (
            <div className="mt-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-3xl shadow-[0_0_24px_rgba(124,58,237,0.15)]">
                {agent.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#e8e8e8]">
                {agent.name}
              </h3>
              <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-[#444444]">
                {agent.greeting}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {lastIsEmptyAssistant && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#555555]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#555555]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#555555]" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-5 pb-6 pt-2">
        <div className="mx-auto w-full max-w-2xl space-y-2">

          {/* ── single image (imagens) ── */}
          {uploadMode === "single-image" && (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f] p-4">
              <DropZone
                label="Imagem do produto"
                file={images[0]}
                error={imageErrors[0]}
                onFile={(f, err) => handleImageAt(0, f, err)}
              />
            </div>
          )}

          {/* ── single image + price (copys) ── */}
          {uploadMode === "single-image+price" && (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f] p-4 space-y-4">
              <DropZone
                label="Imagem do produto"
                file={images[0]}
                error={imageErrors[0]}
                onFile={(f, err) => handleImageAt(0, f, err)}
              />
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#444444]">
                  Preço
                </p>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: R$ 89,90"
                  className="w-full rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-3.5 py-2.5 text-[13px] text-[#e0e0e0] placeholder-[#333333] outline-none transition-colors focus:border-violet-600/40 focus:ring-1 focus:ring-violet-600/20"
                />
              </div>
            </div>
          )}

          {/* ── 3 images + copys (videos) ── */}
          {uploadMode === "3images+copys" && (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f] p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {([0, 1, 2] as const).map((i) => (
                  <DropZone
                    key={i}
                    label={`Cena ${i + 1}`}
                    file={images[i]}
                    error={imageErrors[i]}
                    onFile={(f, err) => handleImageAt(i, f, err)}
                  />
                ))}
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#444444]">
                  Copies / Roteiros
                </p>
                <textarea
                  value={copysText}
                  onChange={(e) => setCopysText(e.target.value)}
                  placeholder="Cole aqui os 3 copies ou roteiros..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-3.5 py-3 text-[13px] leading-relaxed text-[#e0e0e0] placeholder-[#333333] outline-none transition-colors focus:border-violet-600/40 focus:ring-1 focus:ring-violet-600/20"
                />
              </div>
            </div>
          )}

          {/* ── text input for format Q&A ── */}
          {uploadMode === "none" && (
            <div
              className={[
                "flex items-end gap-2 rounded-2xl border bg-[#0f0f0f] p-2 transition-all duration-200",
                inputFocused
                  ? "border-violet-600/30 shadow-[0_0_0_1px_rgba(124,58,237,0.12)]"
                  : "border-[#1e1e1e]",
              ].join(" ")}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                rows={1}
                placeholder={agent.placeholder}
                className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[14px] leading-relaxed text-[#e0e0e0] placeholder-[#333333] focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend()}
                className={[
                  "mb-0.5 mr-0.5 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  canSend()
                    ? "bg-user-bubble text-white shadow-accent-sm hover:opacity-90 hover:scale-105"
                    : "bg-[#1a1a1a] text-[#333333] cursor-not-allowed",
                ].join(" ")}
                aria-label="Enviar"
              >
                ↑
              </button>
            </div>
          )}

          {/* ── send button for upload modes ── */}
          {uploadMode !== "none" && (
            <button
              onClick={sendMessage}
              disabled={!canSend()}
              className={[
                "w-full rounded-xl py-3 text-[13px] font-semibold tracking-wide transition-all duration-200",
                canSend()
                  ? "bg-user-bubble text-white shadow-accent-sm hover:opacity-90 hover:shadow-accent-md"
                  : "cursor-not-allowed bg-[#141414] text-[#333333]",
              ].join(" ")}
            >
              Enviar
            </button>
          )}
        </div>

        <p className="mt-2.5 text-center text-[11px] text-[#2a2a2a]">
          {uploadMode === "none"
            ? "Enter envia · Shift+Enter quebra linha"
            : "Preencha todos os campos para enviar"}
        </p>
      </div>
    </div>
  );
}
