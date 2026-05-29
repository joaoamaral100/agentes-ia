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

// ─── VoiceAssistant ───────────────────────────────────────────────────────────

export default function VoiceAssistant() {
  const [voiceState, setVoiceState]     = useState<VoiceState>("idle");
  const [responseText, setResponseText] = useState("");
  const recRef      = useRef<any>(null);
  const gotResultRef = useRef(false);

  function speak(text: string) {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = "pt-BR";
    utterance.rate  = 1.0;
    utterance.pitch = 1.1;

    const trySpeak = () => {
      const voices  = speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
      if (ptVoice) utterance.voice = ptVoice;
      utterance.onend = () => {
        setVoiceState("idle");
        setTimeout(() => setResponseText(""), 2000);
      };
      speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      speechSynthesis.onvoiceschanged = trySpeak;
    }
  }

  async function handleClick() {
    // If active — cancel everything
    if (voiceState !== "idle") {
      recRef.current?.stop();
      if (typeof window !== "undefined") speechSynthesis.cancel();
      setVoiceState("idle");
      setResponseText("");
      return;
    }

    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const rec = new SR();
    rec.lang            = "pt-BR";
    rec.continuous      = false;
    rec.interimResults  = false;
    recRef.current      = rec;
    gotResultRef.current = false;

    rec.onstart = () => setVoiceState("listening");

    rec.onresult = async (event: any) => {
      gotResultRef.current = true;
      const text = event.results[0][0].transcript;
      setVoiceState("processing");

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        const answer = data.response || "Desculpe, não consegui processar.";
        setResponseText(answer);
        setVoiceState("speaking");
        speak(answer);
      } catch {
        setVoiceState("idle");
      }
    };

    rec.onerror = () => setVoiceState("idle");
    rec.onend   = () => {
      if (!gotResultRef.current) setVoiceState("idle");
    };

    rec.start();
  }

  const STATE_LABEL: Record<VoiceState, string | null> = {
    idle:       null,
    listening:  "JARVIS ouvindo...",
    processing: "JARVIS pensando...",
    speaking:   "JARVIS falando...",
  };

  const label = STATE_LABEL[voiceState];

  const btnStyle = (): React.CSSProperties => {
    if (voiceState === "listening") {
      return {
        background: "linear-gradient(135deg, #dc2626, #ef4444)",
        boxShadow: "0 0 30px rgba(239,68,68,0.5)",
      };
    }
    if (voiceState === "processing") {
      return {
        background: "linear-gradient(135deg, #0066ff, #00d4ff)",
        boxShadow: "0 0 24px rgba(0,212,255,0.4)",
        opacity: 0.8,
      };
    }
    return {
      background: "linear-gradient(135deg, #0066ff, #00d4ff)",
      boxShadow: "0 0 24px rgba(0,212,255,0.4)",
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">

      {/* Response bubble */}
      {responseText && voiceState === "speaking" && (
        <div
          className="max-w-[260px] rounded-xl p-4 text-[13px] leading-relaxed text-white animate-fade-in-up"
          style={{
            background: "rgba(0,8,20,0.95)",
            border: "1px solid rgba(0,212,255,0.3)",
            boxShadow: "0 0 20px rgba(0,212,255,0.15)",
          }}
        >
          {responseText}
        </div>
      )}

      {/* State badge */}
      {label && (
        <div
          className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest"
          style={{
            background: "rgba(0,8,20,0.9)",
            border: "1px solid rgba(0,212,255,0.3)",
            color: voiceState === "listening" ? "#f87171" : "#00d4ff",
          }}
        >
          {label}
        </div>
      )}

      {/* Button */}
      <div className="relative">
        {/* Ripple rings — listening */}
        {voiceState === "listening" && (
          <>
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(239,68,68,0.35)" }}
            />
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(239,68,68,0.18)", animationDelay: "0.35s" }}
            />
          </>
        )}

        {/* Pulse — processing */}
        {voiceState === "processing" && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(0,212,255,0.25)" }}
          />
        )}

        <button
          onClick={handleClick}
          className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300"
          style={btnStyle()}
          onMouseEnter={(e) => {
            if (voiceState === "idle") {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 36px rgba(0,212,255,0.6)";
              (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (voiceState === "idle") {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,212,255,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }
          }}
          title={voiceState === "idle" ? "Ativar assistente JARVIS por voz" : "Cancelar"}
        >
          {voiceState === "idle" || voiceState === "processing" ? (
            <MicSVG />
          ) : (
            <StopSVG />
          )}
        </button>
      </div>
    </div>
  );
}
