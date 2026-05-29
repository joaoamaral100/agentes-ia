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

// ─── DropZone component ───────────────────────────────────────────────────────

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

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
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
      <p className="mb-1.5 text-xs font-medium text-gray-400">{label}</p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer select-none rounded-xl border-2 border-dashed p-4 text-center transition-all",
          dragging
            ? "scale-[1.02] border-blue-400/70 bg-blue-500/10"
            : isValid
            ? "border-green-500/50 bg-green-500/5"
            : error
            ? "border-red-400/50 bg-red-500/5"
            : "border-white/20 bg-white/5 hover:border-white/35",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={onChange}
        />
        {dragging ? (
          <p className="text-sm text-blue-300">Solte aqui...</p>
        ) : isValid ? (
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium text-green-400">✓ {file!.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file!.size)}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-gray-300">
              Arraste ou <span className="underline">escolha imagem</span>
            </p>
            <p className="text-xs text-gray-600">
              JPG · PNG · GIF · WebP · máx {MAX_MB} MB
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
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

  // ── upload mode detection ──────────────────────────────────────────────────

  function detectUploadMode(): UploadMode {
    if (agent.id === "videos") return "3images+copys";

    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length === 0) return "none";

    const last = assistantMsgs[assistantMsgs.length - 1].content.toLowerCase();

    const askingForImage =
      last.includes("manda a imagem do produto") ||
      last.includes("agora manda a imagem") ||
      last.includes("envie a imagem do produto") ||
      last.includes("pode mandar a imagem") ||
      last.includes("mande a imagem do produto") ||
      last.includes("agora envie a imagem");

    const doneAskingFormats =
      assistantMsgs.length >= 4 &&
      !last.includes("cena 1") &&
      !last.includes("cena 2") &&
      !last.includes("cena 3") &&
      !last.includes("qual formato");

    const showUpload = askingForImage || doneAskingFormats;

    if (agent.id === "imagens" && showUpload) return "single-image";
    if (agent.id === "copys" && showUpload) return "single-image+price";
    return "none";
  }

  const uploadMode = detectUploadMode();
  const validImages = images.filter((f, i) => f !== null && imageErrors[i] === null) as File[];

  // ── can send ──────────────────────────────────────────────────────────────

  function canSend(): boolean {
    if (loading) return false;
    if (uploadMode === "single-image") return validImages.length >= 1;
    if (uploadMode === "single-image+price")
      return validImages.length >= 1 && price.trim().length > 0;
    if (uploadMode === "3images+copys")
      return validImages.length === 3 && copysText.trim().length > 0;
    return input.trim().length > 0;
  }

  // ── send ──────────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!canSend()) return;

    const imagesToSend =
      uploadMode === "3images+copys" ? validImages : validImages.slice(0, 1);

    let imageData: ImageData[] = [];
    try {
      imageData =
        imagesToSend.length > 0
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

  // ── render ────────────────────────────────────────────────────────────────

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

      {/* ── input area ── */}
      <div className="px-4 pb-6">
        <div className="mx-auto w-full max-w-3xl space-y-2">

          {/* Gerador de Imagens: single image drop zone */}
          {uploadMode === "single-image" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3">
              <DropZone
                label="Imagem do produto"
                file={images[0]}
                error={imageErrors[0]}
                onFile={(f, err) => handleImageAt(0, f, err)}
              />
            </div>
          )}

          {/* Gerador de Copys: single image + price */}
          {uploadMode === "single-image+price" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3 space-y-3">
              <DropZone
                label="Imagem do produto"
                file={images[0]}
                error={imageErrors[0]}
                onFile={(f, err) => handleImageAt(0, f, err)}
              />
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-400">Preço do produto</p>
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

          {/* Gerador de Vídeos: 3 image drop zones + copys textarea */}
          {uploadMode === "3images+copys" && (
            <div className="rounded-xl border border-white/15 bg-userbubble p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
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
                <p className="mb-1.5 text-xs font-medium text-gray-400">3 copies / roteiros</p>
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

          {/* Normal text input */}
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

          {/* Send button for all upload modes */}
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
          {uploadMode === "none"
            ? "Enter envia · Shift+Enter quebra linha"
            : "Preencha todos os campos para enviar"}
        </p>
      </div>
    </div>
  );
}
