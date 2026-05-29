"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "@/lib/agents";
import MessageBubble, { ChatMessage, ImageData } from "./MessageBubble";

// ─── per-agent themes ─────────────────────────────────────────────────────────

const HEADER_THEMES = {
  imagens: { glow: "rgba(139,92,246,0.25)", bg: "rgba(139,92,246,0.12)" },
  copys:   { glow: "rgba(251,146,60,0.25)",  bg: "rgba(251,146,60,0.12)"  },
  videos:  { glow: "rgba(6,182,212,0.25)",   bg: "rgba(6,182,212,0.12)"  },
} as const;

const AGENT_TIPS = {
  imagens: [
    { icon: "⚡", text: "Envie formatos + imagem juntos" },
    { icon: "🎯", text: "Use referência de cenário" },
    { icon: "✨", text: "3 cenas por geração" },
  ],
  copys: [
    { icon: "🛒", text: "TikTok Shopping optimized" },
    { icon: "📝", text: "2 formatos por resposta" },
    { icon: "⚡", text: "Envie tudo de uma vez" },
  ],
  videos: [
    { icon: "🎬", text: "3 imagens + 3 copies" },
    { icon: "🎥", text: "Sora · Runway · Kling · Veo" },
    { icon: "✨", text: "Prompts 9:16 para TikTok" },
  ],
} as const;

// ─── constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_EXT   = ".jpg,.jpeg,.png,.gif,.webp";
const MAX_MB         = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Formato inválido. Use JPG, PNG, GIF ou WebP.";
  if (file.size > MAX_MB * 1024 * 1024) return `Imagem muito grande. Máximo ${MAX_MB} MB.`;
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
  const [preview, setPreview]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function process(f: File) {
    const err = validateImage(f);
    onFile(f, err);
    if (!err) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
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

  const inner = (
    <div
      onClick={() => inputRef.current?.click()}
      className={[
        "cursor-pointer select-none rounded-xl p-4 text-center transition-all duration-200",
        isValid
          ? "bg-emerald-950/30"
          : error
          ? "bg-red-950/20"
          : dragging
          ? "bg-violet-950/20"
          : "bg-[#0d0d0d] hover:bg-[#111]",
      ].join(" ")}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={onChange} />

      {dragging ? (
        <p className="py-2 text-sm font-medium text-violet-300">Solte aqui...</p>
      ) : isValid && preview ? (
        <div className="space-y-1.5">
          <div className="relative mx-auto w-fit">
            <img
              src={preview}
              alt={file!.name}
              className="mx-auto max-h-24 max-w-full rounded-lg object-cover opacity-90"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-emerald-500/20">
              <span className="text-lg">✓</span>
            </div>
          </div>
          <p className="truncate text-[12px] font-medium text-emerald-400">{file!.name}</p>
          <p className="text-[11px] text-[#3a3a3a]">{formatSize(file!.size)}</p>
        </div>
      ) : (
        <div className="space-y-2 py-1">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#333]">
            ↑
          </div>
          <p className="text-[13px] text-[#4a4a4a]">
            Arraste ou <span className="text-[#666] underline decoration-dotted">escolha</span>
          </p>
          <p className="text-[11px] text-[#2a2a2a]">JPG · PNG · GIF · WebP · máx {MAX_MB} MB</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#333]">{label}</p>

      {/* Rotating gradient border when dragging */}
      {dragging ? (
        <div className="dropzone-spin-wrapper">
          <div className="dropzone-spin-inner">{inner}</div>
        </div>
      ) : (
        <div
          className={[
            "rounded-xl border transition-all duration-200",
            isValid
              ? "border-emerald-500/30"
              : error
              ? "border-red-500/30"
              : "border-[#1e1e1e] hover:border-violet-600/30",
          ].join(" ")}
        >
          {inner}
        </div>
      )}

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
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [images, setImages]             = useState<(File | null)[]>([null, null, null]);
  const [imageErrors, setImageErrors]   = useState<(string | null)[]>([null, null, null]);
  const [price, setPrice]               = useState("");
  const [copysText, setCopysText]       = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
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
    setImages((p) => { const n = [...p]; n[index] = file; return n; });
    setImageErrors((p) => { const n = [...p]; n[index] = error; return n; });
  }

  // ── upload mode ───────────────────────────────────────────────────────────

  function detectUploadMode(): UploadMode {
    if (agent.id === "videos") return "3images+copys";
    if (messages.length === 0) {
      if (agent.id === "imagens") return "single-image";
      if (agent.id === "copys")   return "single-image+price";
    }
    return "none";
  }

  const uploadMode = detectUploadMode();
  const validImages = images.filter((f, i) => f !== null && imageErrors[i] === null) as File[];

  // ── can send ─────────────────────────────────────────────────────────────

  function canSend(): boolean {
    if (loading) return false;
    if (uploadMode === "single-image")       return validImages.length >= 1;
    if (uploadMode === "single-image+price") return validImages.length >= 1 && price.trim().length > 0;
    if (uploadMode === "3images+copys")      return validImages.length === 3 && copysText.trim().length > 0;
    return input.trim().length > 0;
  }

  // ── send ─────────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!canSend()) return;

    const imagesToSend =
      uploadMode === "3images+copys" ? validImages :
      uploadMode === "single-image"  ? validImages.slice(0, 2) :
      validImages.slice(0, 1);

    let imageData: ImageData[] = [];
    try {
      imageData = imagesToSend.length > 0
        ? await Promise.all(imagesToSend.map(fileToImageData))
        : [];
    } catch {
      onMessagesChange([...messages, { role: "assistant", content: "⚠️ Erro ao processar a imagem." }]);
      return;
    }

    let displayContent = input.trim();
    let apiText: string | undefined;

    if (uploadMode === "single-image") {
      const hasRef = imagesToSend.length >= 2;
      if (hasRef) {
        displayContent = `[Produto: ${imagesToSend[0].name}] + [Cenário: ${imagesToSend[1].name}]`;
        apiText = "Aqui está a imagem do produto (IMAGEM 1) e a referência do cenário (IMAGEM 2). Use o cenário da imagem 2 e substitua apenas o produto.";
      } else {
        displayContent = `[Imagem: ${imagesToSend[0].name} · ${formatSize(imagesToSend[0].size)}]`;
        apiText = "Aqui está a imagem do produto.";
      }
    } else if (uploadMode === "single-image+price") {
      displayContent = `[Imagem: ${imagesToSend[0].name}] · Preço: ${price}`;
      apiText = `Aqui está a imagem do produto. O preço é: ${price}.`;
    } else if (uploadMode === "3images+copys") {
      displayContent = `[${imagesToSend.length} imagens enviadas]\n\n${copysText}`;
      apiText = `Aqui estão as 3 imagens e os copies/roteiros:\n\n${copysText}`;
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
        onMessagesChange([...history, { role: "assistant", content: `⚠️ ${err.error ?? "Erro desconhecido."}` }]);
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
      const msg = err instanceof Error ? err.message : "Falha de conexão.";
      onMessagesChange([...history, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const isEmpty = messages.length === 0;
  const lastIsEmptyAssistant =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  const theme  = HEADER_THEMES[agent.id];
  const tips   = AGENT_TIPS[agent.id];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-1 flex-col bg-[#0a0a0a]">

      {/* Header */}
      <header className="glass flex items-center gap-3 border-b border-[#141414] px-6 py-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: theme.bg, boxShadow: `0 0 16px ${theme.glow}` }}
        >
          {agent.icon}
        </div>
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-[#efefef]">{agent.name}</h2>
          <p className="text-[11px] text-[#333]">{agent.description}</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-5 py-8">

          {isEmpty ? (
            <div className="space-y-6">
              {/* Initial agent message as assistant bubble */}
              <MessageBubble message={{ role: "assistant", content: agent.greeting }} />

              {/* Quick tip cards */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {tips.map((tip, i) => (
                  <div
                    key={i}
                    className="glass rounded-xl p-3 text-center transition-all duration-200 hover:border-[#2a2a2a]"
                  >
                    <div className="mb-1 text-lg">{tip.icon}</div>
                    <p className="text-[11px] leading-snug text-[#444]">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {lastIsEmptyAssistant && (
                <div className="flex items-end gap-1.5 px-1 pb-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#444]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#444]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#444]" />
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
            <div className="glass rounded-2xl p-4 space-y-4">
              <DropZone label="Imagem do produto" file={images[0]} error={imageErrors[0]} onFile={(f, e) => handleImageAt(0, f, e)} />
              <div>
                <p className="mb-2 text-[11px] leading-relaxed text-[#2f2f2f]">
                  Referência de cenário — envie para manter o ambiente e só trocar o produto
                </p>
                <DropZone label="Cenário de referência (opcional)" file={images[1]} error={imageErrors[1]} onFile={(f, e) => handleImageAt(1, f, e)} />
              </div>
            </div>
          )}

          {/* ── single image + price (copys) ── */}
          {uploadMode === "single-image+price" && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <DropZone label="Imagem do produto" file={images[0]} error={imageErrors[0]} onFile={(f, e) => handleImageAt(0, f, e)} />
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#333]">Preço</p>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: R$ 89,90"
                  className="w-full rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] px-3.5 py-2.5 text-[13px] text-[#e0e0e0] placeholder-[#2a2a2a] outline-none transition-colors focus:border-violet-600/40 focus:ring-1 focus:ring-violet-600/15"
                />
              </div>
            </div>
          )}

          {/* ── 3 images + copys (videos) ── */}
          {uploadMode === "3images+copys" && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {([0, 1, 2] as const).map((i) => (
                  <DropZone key={i} label={`Cena ${i + 1}`} file={images[i]} error={imageErrors[i]} onFile={(f, e) => handleImageAt(i, f, e)} />
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#333]">Copies / Roteiros</p>
                <textarea
                  value={copysText}
                  onChange={(e) => setCopysText(e.target.value)}
                  placeholder="Cole aqui os 3 copies ou roteiros..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] px-3.5 py-3 text-[13px] leading-relaxed text-[#e0e0e0] placeholder-[#2a2a2a] outline-none transition-colors focus:border-violet-600/40 focus:ring-1 focus:ring-violet-600/15"
                />
              </div>
            </div>
          )}

          {/* ── text input ── */}
          {uploadMode === "none" && (
            <div
              className="flex items-end gap-2 rounded-2xl p-2 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(12px)",
                border: inputFocused
                  ? "1px solid rgba(124,58,237,0.35)"
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: inputFocused ? "0 0 0 1px rgba(124,58,237,0.12)" : undefined,
              }}
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
                className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[14px] leading-relaxed text-[#e0e0e0] placeholder-[#2a2a2a] focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend()}
                className="mb-0.5 mr-0.5 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
                style={
                  canSend()
                    ? {
                        background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
                        boxShadow: "0 0 12px rgba(124,58,237,0.3)",
                        color: "white",
                      }
                    : { background: "#141414", color: "#2a2a2a" }
                }
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
              className="w-full rounded-xl py-3 text-[13px] font-semibold tracking-wide transition-all duration-200"
              style={
                canSend()
                  ? {
                      background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
                      boxShadow: "0 0 18px rgba(124,58,237,0.25)",
                      color: "white",
                    }
                  : { background: "#111", color: "#2a2a2a", cursor: "not-allowed" }
              }
            >
              Enviar
            </button>
          )}
        </div>

        <p className="mt-2.5 text-center text-[10px] text-[#1e1e1e]">
          {uploadMode === "none"
            ? "Enter envia · Shift+Enter quebra linha"
            : "Preencha todos os campos para enviar"}
        </p>
      </div>
    </div>
  );
}
