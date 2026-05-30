"use client";

import { useState } from "react";

type State = "idle" | "recording" | "processing" | "speaking";

const LABELS: Record<State, string> = {
  idle:       "Falar com JARVIS",
  recording:  "Gravando... (clique para parar)",
  processing: "Processando...",
  speaking:   "Respondendo...",
};

export default function VoiceAssistant() {
  const [status, setStatus] = useState<State>("idle");
  const [info, setInfo]     = useState("");

  async function run() {
    // ── 1. Permissão de microfone ──────────────────────────────────────────
    console.log("1. Iniciando gravacao...");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Permita o acesso ao microfone nas configurações do navegador.");
      return;
    }

    // ── 2. Detecta formato e inicia MediaRecorder ─────────────────────────
    const mimeType =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
      MediaRecorder.isTypeSupported("audio/webm")             ? "audio/webm"             :
      MediaRecorder.isTypeSupported("audio/mp4")              ? "audio/mp4"              :
      "audio/ogg";

    console.log("2. Gravacao iniciada, formato:", mimeType);
    setStatus("recording");
    setInfo("Gravando por 5s...");

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    // ── 3. Grava 5s ───────────────────────────────────────────────────────
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.start();
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 5000);
    });
    stream.getTracks().forEach((t) => t.stop());

    const audioBlob = new Blob(chunks, { type: mimeType });
    console.log("3. Audio gravado, tamanho:", audioBlob.size);
    setStatus("processing");
    setInfo("Transcrevendo...");

    // ── 4. Whisper ────────────────────────────────────────────────────────
    console.log("4. Enviando para Whisper...");
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    const fd  = new FormData();
    fd.append("audio", audioBlob, `audio.${ext}`);

    let transcript = "";
    try {
      const r1   = await fetch("/api/voice", { method: "POST", body: fd });
      const d1   = await r1.json();
      transcript = d1.transcript?.trim() ?? "";
      console.log("5. Transcript:", transcript);
    } catch (err) {
      console.error("Erro Whisper:", err);
      setStatus("idle"); setInfo(""); return;
    }

    if (!transcript) {
      setInfo("Nenhuma fala detectada.");
      setTimeout(() => { setStatus("idle"); setInfo(""); }, 2000);
      return;
    }
    setInfo(transcript);

    // ── 5. Claude ─────────────────────────────────────────────────────────
    console.log("6. Enviando para Claude...");
    let answer = "";
    try {
      const r2 = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, type: "chat" }),
      });
      const d2 = await r2.json();
      answer   = d2.response ?? "";
      console.log("7. Resposta Claude:", answer);
    } catch (err) {
      console.error("Erro Claude:", err);
      setStatus("idle"); setInfo(""); return;
    }

    setInfo(answer);

    // ── 6. TTS ────────────────────────────────────────────────────────────
    console.log("8. Enviando para TTS...");
    setStatus("speaking");
    try {
      const clean = answer.replace(/[*_#~>`]/g, "").replace(/\s+/g, " ").trim();
      const r3    = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, type: "tts" }),
      });
      const blob = await r3.blob();
      const url  = URL.createObjectURL(blob);
      console.log("9. Audio recebido, tocando...");
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setStatus("idle"); setInfo(""); };
      await audio.play();
    } catch (err) {
      console.error("Erro TTS:", err);
      setStatus("idle"); setInfo("");
    }
  }

  function handleClick() {
    if (status === "idle") {
      new Audio().play().catch(() => {});
      run();
    }
  }

  const isActive  = status !== "idle";
  const isRecord  = status === "recording";

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">

      {/* Info bubble */}
      {info && (
        <div
          className="max-w-[260px] rounded-xl px-4 py-3 text-[13px] leading-relaxed text-white"
          style={{ background: "rgba(0,8,20,0.95)", border: "1px solid rgba(0,212,255,0.3)" }}
        >
          {info}
        </div>
      )}

      {/* Label */}
      {isActive && (
        <div
          className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest"
          style={{ background: "rgba(0,8,20,0.9)", border: "1px solid rgba(0,212,255,0.3)", color: isRecord ? "#f87171" : "#00d4ff" }}
        >
          {LABELS[status]}
        </div>
      )}

      {/* Button */}
      <div className="relative">
        {isRecord && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.35)" }} />
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.18)", animationDelay: "0.35s" }} />
          </>
        )}
        {status === "processing" && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(0,212,255,0.25)" }} />
        )}
        <button
          onClick={handleClick}
          disabled={isActive}
          className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300"
          style={
            isRecord
              ? { background: "linear-gradient(135deg,#dc2626,#ef4444)", boxShadow: "0 0 30px rgba(239,68,68,0.5)" }
              : { background: "linear-gradient(135deg,#0066ff,#00d4ff)", boxShadow: "0 0 24px rgba(0,212,255,0.4)", opacity: isActive ? 0.7 : 1 }
          }
          title={LABELS[status]}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="9" y1="21" x2="15" y2="21" />
          </svg>
        </button>
      </div>
    </div>
  );
}
