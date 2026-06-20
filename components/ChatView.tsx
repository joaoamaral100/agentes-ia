"use client";

import { useEffect, useRef, useState } from "react";
import { Agent } from "@/lib/agents";
import MessageBubble, { ChatMessage, ImageData } from "./MessageBubble";
import CopyDisplay from "./CopyDisplay";

interface AttachedImage {
  name: string;
  originalSize: number;
  base64: string;
  mediaType: "image/jpeg";
  previewUrl: string;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function CameraIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6l2-3h4l2 3" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}
function CopyTextIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M15 3h6v6" />
      <path d="M10 14l9-9" />
      <path d="M6 12h6M6 16h4" />
    </svg>
  );
}
function VideoPlayIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="M17 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
      <path d="M6 9h6M6 12h8M6 15h5" />
    </svg>
  );
}
function ShirtIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.14a1 1 0 001-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}
function AgentIcon({ id, size = 20, style }: { id: string; size?: number; style?: React.CSSProperties }) {
  if (id === "imagens")     return <CameraIcon    size={size} style={style} />;
  if (id === "copys")       return <CopyTextIcon  size={size} style={style} />;
  if (id === "mode-amaral") return <ShirtIcon     size={size} style={style} />;
  return                           <VideoPlayIcon size={size} style={style} />;
}
function MicIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}
function UploadIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function SendIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#ffffff" />
    </svg>
  );
}
function TrashIcon({ size = 15, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

// ─── constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_EXT   = ".jpg,.jpeg,.png,.gif,.webp";
const MAX_MB         = 10;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Formato inválido.";
  if (file.size > MAX_MB * 1024 * 1024) return `Máximo ${MAX_MB} MB.`;
  return null;
}
async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve({ base64: r.split(",")[1], mediaType: file.type, name: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1024;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else        { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.src = "data:image/jpeg;base64," + base64;
  });
}
function maxImages(agentId: string) {
  if (agentId === "videos")  return 3;
  if (agentId === "imagens") return 2;
  return 1;
}

// ─── ChatView ─────────────────────────────────────────────────────────────────
interface ChatViewProps {
  agent: Agent;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onMenuClick?: () => void;
}

export default function ChatView({ agent, messages, onMessagesChange, onMenuClick }: ChatViewProps) {
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [attachedImages, setAttached]   = useState<AttachedImage[]>([]);
  const [price, setPrice]               = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [listening, setListening]       = useState(false);
  const [chatDragOver, setDragOver]     = useState(false);

  const draftKey      = `jarvis_draft_${agent.id}`;
  const scrollRef     = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const recRef        = useRef<any>(null);
  const listeningRef  = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as { text?: string; price?: string; images?: AttachedImage[] };
      if (draft.text)           setInput(draft.text);
      if (draft.price)          setPrice(draft.price);
      if (draft.images?.length) setAttached(draft.images);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!input && !price && attachedImages.length === 0) {
      localStorage.removeItem(draftKey);
      return;
    }
    try {
      localStorage.setItem(draftKey, JSON.stringify({ text: input, price, images: attachedImages }));
    } catch {}
  }, [input, price, attachedImages, draftKey]);

  async function addImages(files: File[]) {
    const max   = maxImages(agent.id);
    const valid = files.filter(f => validateImage(f) === null);
    if (!valid.length) return;
    const newImgs = await Promise.all(valid.map(async (file) => {
      const raw        = await fileToImageData(file);
      const compressed = await compressImage(raw.base64);
      return { name: file.name, originalSize: file.size, base64: compressed, mediaType: "image/jpeg" as const, previewUrl: `data:image/jpeg;base64,${compressed}` };
    }));
    setAttached(prev => [...prev, ...newImgs].slice(0, max));
  }

  function removeImage(i: number) {
    setAttached(prev => prev.filter((_, idx) => idx !== i));
  }

  function onChatDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function onChatDragLeave(e: React.DragEvent) {
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }
  function onChatDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    addImages(Array.from(e.dataTransfer.files));
  }

  function toggleMic() {
    if (listeningRef.current) {
      listeningRef.current = false;
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Seu navegador não suporta reconhecimento de voz."); return; }
    const rec = new SR();
    rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (ev: any) => {
      let t = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      setInput(t);
    };
    rec.onerror = () => { listeningRef.current = false; setListening(false); };
    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start(); } catch { listeningRef.current = false; setListening(false); }
      } else {
        setListening(false);
      }
    };
    listeningRef.current = true;
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  function canSend(): boolean {
    if (loading) return false;
    if (attachedImages.length > 0) return true;
    return input.trim().length > 0;
  }

  async function sendMessage() {
    if (!canSend()) return;

    const imageData: ImageData[] = attachedImages.map(img => ({
      base64: img.base64,
      mediaType: img.mediaType,
      name: img.name,
    }));

    let displayContent = input.trim();
    let apiText: string | undefined;

    if (imageData.length > 0) {
      if (agent.id === "imagens") {
        if (imageData.length >= 2) {
          displayContent = `[Produto: ${attachedImages[0].name}] + [Cenário: ${attachedImages[1].name}]`;
          apiText = `Aqui estão as imagens: produto (IMAGEM 1) e referência do cenário (IMAGEM 2).${input.trim() ? " " + input.trim() : ""}`;
        } else {
          displayContent = `[Imagem: ${attachedImages[0].name} · ${formatSize(attachedImages[0].originalSize)}]${input.trim() ? "\n\n" + input.trim() : ""}`;
          apiText = `Aqui está a imagem do produto.${input.trim() ? " " + input.trim() : ""}`;
        }
      } else if (agent.id === "copys") {
        displayContent = `[Imagem: ${attachedImages[0].name}]${price.trim() ? " · Preço: " + price.trim() : ""}`;
        apiText = `Aqui está a imagem do produto.${price.trim() ? " O preço é: " + price.trim() + "." : ""}${input.trim() ? " " + input.trim() : ""}`;
      } else {
        displayContent = `[${imageData.length} imagem${imageData.length > 1 ? "ns" : ""}]${input.trim() ? "\n\n" + input.trim() : ""}`;
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: displayContent || input.trim(),
      images: imageData.length > 0 ? imageData : undefined,
      apiText,
    };

    const history = [...messages, userMessage];
    onMessagesChange(history);
    setInput("");
    setAttached([]);
    setPrice("");
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
        onMessagesChange([...history, { role: "assistant", content: `⚠️ ${err.error ?? "Erro."}` }]);
        setLoading(false); return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
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
  const lastIsEmpty =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  const canAttachMore = attachedImages.length < maxImages(agent.id);

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #000e22 0%, #000814 55%, #000208 100%)" }}
    >
      {/* HUD background layer: grid + orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hud-grid" style={{ zIndex: 0 }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
        {/* Top-right orb */}
        <div style={{ position: "absolute", top: "-160px", right: "-160px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,120,255,0.09) 0%, transparent 70%)", filter: "blur(120px)", animation: "orb-drift 18s ease-in-out infinite" }} />
        {/* Bottom-left orb */}
        <div style={{ position: "absolute", bottom: "-160px", left: "-160px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)", filter: "blur(100px)", animation: "orb-drift 22s ease-in-out infinite reverse", animationDelay: "-8s" }} />
        {/* Center dim orb */}
        <div style={{ position: "absolute", top: "30%", left: "40%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,150,255,0.04) 0%, transparent 70%)", filter: "blur(80px)", animation: "orb-drift 14s ease-in-out infinite", animationDelay: "-4s" }} />
      </div>

      {/* Header */}
      <header
        className="relative z-10 flex items-center gap-3 px-4 py-3.5 md:px-6"
        style={{
          background: "rgba(0,8,20,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,212,255,0.1)",
        }}
      >
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg md:hidden"
          style={{ color: "#4a9ebb", transition: "all 0.2s ease-out" }}
        >
          <HamburgerIcon />
        </button>

        <div
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl md:flex"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,102,255,0.1))",
            border: "1px solid rgba(0,212,255,0.22)",
          }}
        >
          <AgentIcon id={agent.id} size={19} style={{ color: "#00d4ff" }} />
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="font-display text-[16px] font-bold leading-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff, #b0d8f0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {agent.name}
          </h2>
          <div className="flex items-center gap-2">
            <p className="truncate text-[11px]" style={{ color: "rgba(74,158,187,0.5)" }}>
              {agent.description}
            </p>
            {!isEmpty && (
              <span className="shrink-0 text-[10px]" style={{ color: "rgba(74,158,187,0.3)" }}>
                · {messages.filter(m => !(m.role === "assistant" && m.content === "")).length} msgs
              </span>
            )}
          </div>
        </div>

        {/* ONLINE indicator */}
        <div className="hidden items-center gap-1.5 md:flex">
          <div className="status-online h-1.5 w-1.5 rounded-full" />
          <span style={{ color: "rgba(34,197,94,0.65)", fontSize: "9px", letterSpacing: "2px", fontFamily: "monospace" }}>
            ONLINE
          </span>
        </div>

        {!isEmpty && !loading && (
          <button
            onClick={() => onMessagesChange([])}
            title="Limpar conversa"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ color: "rgba(74,158,187,0.35)", background: "transparent", transition: "all 0.15s ease-out" }}
            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, { color: "#f87171", background: "rgba(239,68,68,0.08)" })}
            onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { color: "rgba(74,158,187,0.35)", background: "transparent" })}
          >
            <TrashIcon size={14} />
          </button>
        )}
      </header>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto"
        onDragOver={onChatDragOver}
        onDragLeave={onChatDragLeave}
        onDrop={onChatDrop}
      >
        {chatDragOver && (
          <div
            className="pointer-events-none absolute inset-4 z-50 flex items-center justify-center rounded-xl"
            style={{ border: "1px dashed rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.02)" }}
          >
            <p className="text-sm font-medium" style={{ color: "#00d4ff" }}>Solte as imagens aqui</p>
          </div>
        )}

        <div className="mx-auto w-full max-w-2xl px-5 py-8">
          {isEmpty ? (
            /* ── Empty state: Iron Man HUD ── */
            <div className="flex flex-col items-center justify-center pt-12 text-center">

              {/* Triple rotating HUD rings */}
              <div className="relative mb-10 flex h-52 w-52 items-center justify-center">
                {/* Outer ambient glow */}
                <div style={{
                  position: "absolute",
                  inset: "-20px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 65%)",
                  filter: "blur(24px)",
                }} />
                {/* Ring 1 — outermost, slow CW */}
                <div style={{
                  position: "absolute",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  border: "1px solid rgba(0,212,255,0.12)",
                  borderTopColor: "rgba(0,212,255,0.6)",
                  borderRightColor: "rgba(0,212,255,0.3)",
                  animation: "ring-cw 14s linear infinite",
                }} />
                {/* Ring 1 tick */}
                <div style={{ position: "absolute", top: "22px", left: "50%", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,212,255,0.8)", boxShadow: "0 0 6px rgba(0,212,255,0.9)", transform: "translateX(-50%)", animation: "ring-cw 14s linear infinite" }} />

                {/* Ring 2 — middle, CCW */}
                <div style={{
                  position: "absolute",
                  width: "162px",
                  height: "162px",
                  borderRadius: "50%",
                  border: "1px solid rgba(0,212,255,0.08)",
                  borderBottomColor: "rgba(0,212,255,0.5)",
                  borderLeftColor: "rgba(0,212,255,0.25)",
                  animation: "ring-ccw 9s linear infinite",
                }} />
                {/* Ring 2 tick */}
                <div style={{ position: "absolute", bottom: "35px", left: "50%", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(0,212,255,0.7)", boxShadow: "0 0 5px rgba(0,212,255,0.8)", transform: "translateX(-50%)", animation: "ring-ccw 9s linear infinite" }} />

                {/* Ring 3 — inner, fast CW */}
                <div style={{
                  position: "absolute",
                  width: "124px",
                  height: "124px",
                  borderRadius: "50%",
                  border: "1px dashed rgba(0,212,255,0.06)",
                  borderTopColor: "rgba(0,212,255,0.35)",
                  animation: "ring-cw 5s linear infinite",
                }} />

                {/* Center icon */}
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-3xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,102,255,0.07))",
                    border: "1px solid rgba(0,212,255,0.22)",
                    boxShadow: "0 0 30px rgba(0,212,255,0.12), inset 0 0 20px rgba(0,212,255,0.04)",
                  }}
                >
                  <AgentIcon
                    id={agent.id}
                    size={46}
                    style={{ color: "#00d4ff", filter: "drop-shadow(0 0 10px rgba(0,212,255,0.7))" }}
                  />
                </div>
              </div>

              <h3
                className="font-display mb-3 text-4xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #b0d8ef 40%, #00d4ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 20px rgba(0,212,255,0.2))",
                }}
              >
                {agent.name}
              </h3>
              <p className="mx-auto mb-8 max-w-xs text-[14px] leading-relaxed" style={{ color: "rgba(160,200,220,0.5)" }}>
                {agent.description}
              </p>

              {/* Sistema online badge */}
              <div className="flex items-center gap-2">
                <div className="status-online h-1.5 w-1.5 rounded-full" />
                <span style={{ color: "rgba(34,197,94,0.6)", fontSize: "10px", letterSpacing: "2.5px", fontFamily: "monospace" }}>
                  SISTEMA ONLINE
                </span>
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="space-y-5">
              {messages.map((m, i) =>
                agent.id === "copys" && m.role === "assistant" && m.content
                  ? <CopyDisplay key={i} content={m.content} />
                  : <MessageBubble key={i} message={m} agentId={agent.id} />
              )}
              {lastIsEmpty && (
                <div className="flex items-end gap-1.5 px-1 pb-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ background: "#00d4ff" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ background: "#00d4ff" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full" style={{ background: "#00d4ff" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="relative z-10 px-5 pb-6 pt-2">
        <div className="mx-auto w-full max-w-2xl space-y-2">

          {agent.id === "copys" && attachedImages.length > 0 && (
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Preço do produto (ex: R$ 89,90)"
              className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#e0f4ff", transition: "border-color 0.2s ease-out" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            />
          )}

          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2">
              {attachedImages.map((img, i) => (
                <div key={i} className="relative h-12 w-12 shrink-0">
                  <img src={img.previewUrl} alt={img.name} className="h-12 w-12 rounded-lg object-cover" style={{ border: "1px solid rgba(0,212,255,0.22)" }} />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: "#000814", border: "1px solid rgba(0,212,255,0.4)", color: "#00d4ff" }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {canAttachMore && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ border: "1px dashed rgba(0,212,255,0.22)", color: "#4a9ebb", background: "rgba(0,212,255,0.03)", transition: "all 0.2s ease-out" }}
                  title="Adicionar imagem"
                >
                  +
                </button>
              )}
              <span className="text-[11px]" style={{ color: "#4a9ebb" }}>
                {attachedImages.length}/{maxImages(agent.id)} imagem{maxImages(agent.id) > 1 ? "ns" : ""}
              </span>
            </div>
          )}

          {/* Main input bar */}
          <div
            className={["flex items-end gap-1.5 rounded-2xl p-2", listening ? "input-listening" : ""].join(" ")}
            style={{
              background: "rgba(4,12,28,0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: listening
                ? "1px solid rgba(239,68,68,0.4)"
                : inputFocused
                ? "1px solid rgba(0,212,255,0.35)"
                : "1px solid rgba(255,255,255,0.07)",
              boxShadow: inputFocused && !listening ? "0 0 0 3px rgba(0,212,255,0.05)" : undefined,
              transition: "border-color 0.2s ease-out, box-shadow 0.2s ease-out",
            }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAttachMore}
              title="Anexar imagem"
              className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: canAttachMore ? "#4a9ebb" : "rgba(255,255,255,0.15)", background: "transparent", transition: "all 0.15s ease-out" }}
              onMouseEnter={(e) => { if (canAttachMore) Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(0,212,255,0.08)", color: "#00d4ff" }); }}
              onMouseLeave={(e) => { if (canAttachMore) Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "#4a9ebb" }); }}
            >
              <UploadIcon size={16} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT}
              multiple={maxImages(agent.id) > 1}
              className="hidden"
              onChange={(e) => { addImages(Array.from(e.target.files ?? [])); e.target.value = ""; }}
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              rows={1}
              placeholder={listening ? "Ouvindo..." : agent.placeholder}
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed focus:outline-none"
              style={{ color: "#e0f4ff" }}
            />

            <button
              type="button"
              onClick={toggleMic}
              title={listening ? "Parar gravação" : "Gravar voz (pt-BR)"}
              className={["mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg", listening ? "mic-listening" : ""].join(" ")}
              style={{
                ...(listening ? { background: "rgba(239,68,68,0.12)", color: "#f87171" } : { background: "transparent", color: "#4a9ebb" }),
                transition: "all 0.15s ease-out",
              }}
              onMouseEnter={(e) => { if (!listening) Object.assign((e.currentTarget as HTMLElement).style, { background: "rgba(0,212,255,0.08)", color: "#00d4ff" }); }}
              onMouseLeave={(e) => { if (!listening) Object.assign((e.currentTarget as HTMLElement).style, { background: "transparent", color: "#4a9ebb" }); }}
            >
              <MicIcon size={16} />
            </button>

            {/* Send — white icon, spring hover */}
            <button
              onClick={sendMessage}
              disabled={!canSend()}
              className="send-btn mb-0.5 mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: canSend()
                  ? "linear-gradient(145deg, #1a44ff, #0077cc)"
                  : "rgba(255,255,255,0.04)",
                boxShadow: canSend()
                  ? "0 2px 8px rgba(0,60,200,0.4), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : undefined,
              }}
              aria-label="Enviar"
            >
              <SendIcon
                size={16}
                style={{
                  opacity: canSend() ? 1 : 0.2,
                  filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))",
                }}
              />
            </button>
          </div>
        </div>

        <p className="mt-2.5 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.1)" }}>
          Enter envia · Shift+Enter quebra linha · 📎 anexa imagens
        </p>
      </div>
    </div>
  );
}
