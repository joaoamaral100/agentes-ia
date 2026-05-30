"use client";

import { useRef, useState } from "react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

// ─── Icons ────────────────────────────────────────────────────────────────────

function MicSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function StopSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[*_#~>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── VoiceAssistant ───────────────────────────────────────────────────────────

export default function VoiceAssistant() {
  const [state, setState]           = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse]     = useState("");
  const [minimized, setMinimized]   = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const cancelledRef     = useRef(false);
  const clicksRef        = useRef(0);

  // ── 3: TTS ────────────────────────────────────────────────────────────────
  async function speakText(text: string) {
    setState("speaking");
    console.log("Falando...");
    const clean = cleanText(text);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, type: "tts" }),
      });
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setState("idle");
        setMinimized(true);
        setTimeout(() => { setTranscript(""); setResponse(""); }, 2000);
      };
      await audio.play();
    } catch (err) {
      console.error("Erro TTS:", err);
      setState("idle");
    }
  }

  // ── 2: Chat ───────────────────────────────────────────────────────────────
  async function askClaude(text: string) {
    console.log("Transcript:", text);
    setTranscript(text);
    setState("processing");
    console.log("Processando...");
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "chat" }),
      });
      if (!res.ok) throw new Error(`Chat HTTP ${res.status}`);
      const data = await res.json();
      const answer = data.response || "Desculpe, não consegui processar.";
      console.log("Resposta:", answer);
      setResponse(answer);
      if (!cancelledRef.current) await speakText(answer);
    } catch (err) {
      console.error("Erro chat:", err);
      setState("idle");
    }
  }

  // ── 1: Whisper ────────────────────────────────────────────────────────────
  async function transcribeAudio(blob: Blob, mimeType: string) {
    if (cancelledRef.current) return;
    console.log("Transcrevendo áudio...");
    const ext      = mimeType.includes("webm") ? "webm" : "mp4";
    const formData = new FormData();
    formData.append("audio", blob, `audio.${ext}`);
    try {
      const res = await fetch("/api/voice", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Whisper HTTP ${res.status}`);
      const data = await res.json();
      const text = data.transcript?.trim();
      if (!text) { console.log("Nenhuma fala detectada."); setState("idle"); return; }
      if (!cancelledRef.current) await askClaude(text);
    } catch (err) {
      console.error("Erro Whisper:", err);
      setState("idle");
    }
  }

  // ── 0: Gravar ─────────────────────────────────────────────────────────────
  async function startRecording() {
    cancelledRef.current = false;
    try {
      const stream    = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType  = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder  = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      streamRef.current       = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (cancelledRef.current) return;
        const audioBlob = new Blob(chunks, { type: mimeType });
        setState("processing");
        await transcribeAudio(audioBlob, mimeType);
      };

      recorder.start();
      setState("listening");
      console.log("Ouvindo...");

      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 5000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      setState("idle");
    }
  }

  // ── handleClick ───────────────────────────────────────────────────────────
  function handleClick() {
    if (state !== "idle") {
      cancelledRef.current = true;
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setState("idle");
      setTranscript("");
      setResponse("");
      return;
    }
    // Desbloqueia autoplay (iOS/Safari) no evento de clique
    new Audio().play().catch(() => {});
    startRecording();
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const LABEL: Record<VoiceState, string | null> = {
    idle:       null,
    listening:  "JARVIS ouvindo...",
    processing: "JARVIS pensando...",
    speaking:   "JARVIS respondendo...",
  };

  const btnStyle = (): React.CSSProperties => {
    if (state === "listening") return { background: "linear-gradient(135deg,#dc2626,#ef4444)", boxShadow: "0 0 30px rgba(239,68,68,0.5)" };
    if (state === "processing") return { background: "linear-gradient(135deg,#0066ff,#00d4ff)", boxShadow: "0 0 24px rgba(0,212,255,0.4)", opacity: 0.8 };
    return { background: "linear-gradient(135deg,#0066ff,#00d4ff)", boxShadow: "0 0 24px rgba(0,212,255,0.4)" };
  };

  function handleMiniClick() {
    clicksRef.current += 1;
    if (clicksRef.current >= 2) { clicksRef.current = 0; setMinimized(false); }
    else setTimeout(() => { clicksRef.current = 0; }, 400);
  }

  if (minimized && state === "idle") {
    return (
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={handleMiniClick}
          onMouseEnter={() => setMinimized(false)}
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg,#0066ff,#00d4ff)", boxShadow: "0 0 8px rgba(0,212,255,0.4)" }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">

      {/* Bubble */}
      {(transcript || response) && state !== "idle" && (
        <div
          className="max-w-[260px] rounded-xl p-4 text-[13px] leading-relaxed text-white"
          style={{ background: "rgba(0,8,20,0.95)", border: "1px solid rgba(0,212,255,0.3)", boxShadow: "0 0 20px rgba(0,212,255,0.15)" }}
        >
          {transcript && <p style={{ color: "#94a3b8", marginBottom: response ? "8px" : "0" }}>{transcript}</p>}
          {response && <p>{response}</p>}
        </div>
      )}

      {/* State label */}
      {LABEL[state] && (
        <div
          className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest"
          style={{ background: "rgba(0,8,20,0.9)", border: "1px solid rgba(0,212,255,0.3)", color: state === "listening" ? "#f87171" : "#00d4ff" }}
        >
          {LABEL[state]}
        </div>
      )}

      {/* Button */}
      <div className="relative">
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.35)" }} />
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.18)", animationDelay: "0.35s" }} />
          </>
        )}
        {state === "processing" && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(0,212,255,0.25)" }} />
        )}
        <button
          onClick={handleClick}
          className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300"
          style={btnStyle()}
          onMouseEnter={(e) => {
            if (state === "idle") { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 36px rgba(0,212,255,0.6)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }
          }}
          onMouseLeave={(e) => {
            if (state === "idle") { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,212,255,0.4)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }
          }}
          title={state === "idle" ? "Ativar JARVIS por voz" : "Cancelar"}
        >
          {state === "idle" || state === "processing" ? <MicSVG /> : <StopSVG />}
        </button>
      </div>
    </div>
  );
}
