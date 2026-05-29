"use client";

import { useState } from "react";

function JarvisWordmark() {
  return (
    <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0" y="28"
        fontFamily="Georgia, serif"
        fontSize="24"
        fontWeight="400"
        letterSpacing="8"
        fill="url(#login-grad)"
        style={{ filter: "drop-shadow(0 0 10px rgba(0,212,255,0.9))" }}
      >
        JARVIS
      </text>
      <defs>
        <linearGradient id="login-grad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="60%"  stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD ?? "bext2024";

    if (password === correctPassword) {
      localStorage.setItem("jarvis_auth", "true");
      onSuccess();
    } else {
      setError("Senha incorreta. Tente novamente.");
      setPassword("");
    }

    setLoading(false);
  }

  return (
    <div
      className="dot-grid relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#000814" }}
    >
      {/* Orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(0, 212, 255, 0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 212, 255, 0.18)",
            boxShadow: "0 0 60px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)",
          }}
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <JarvisWordmark />
          </div>

          {/* Title */}
          <div className="mb-6 text-center">
            <h1
              className="mb-1 text-xl font-semibold tracking-wide"
              style={{
                background: "linear-gradient(135deg, #ffffff, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Acesso Restrito
            </h1>
            <p className="text-[13px]" style={{ color: "#4a9ebb" }}>
              Digite a senha para continuar
            </p>
          </div>

          {/* Password input */}
          <div className="mb-4">
            <div
              className="flex items-center rounded-xl transition-all duration-200"
              style={{
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
              onFocus={() => {}}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Senha de acesso"
                autoFocus
                className="flex-1 bg-transparent px-4 py-3 text-[14px] outline-none"
                style={{ color: "#e0f4ff" }}
                onFocus={(e) => {
                  (e.currentTarget.closest("div") as HTMLElement).style.border = "1px solid rgba(0,212,255,0.5)";
                  (e.currentTarget.closest("div") as HTMLElement).style.boxShadow = "0 0 0 1px rgba(0,212,255,0.12), 0 0 16px rgba(0,212,255,0.08)";
                }}
                onBlur={(e) => {
                  (e.currentTarget.closest("div") as HTMLElement).style.border = "1px solid rgba(0,212,255,0.2)";
                  (e.currentTarget.closest("div") as HTMLElement).style.boxShadow = "";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 transition-colors"
                style={{ color: showPassword ? "#00d4ff" : "#4a9ebb" }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p
                className="mt-2 text-[12px]"
                style={{ color: "#f87171" }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold tracking-wide transition-all duration-200"
            style={
              loading || !password.trim()
                ? { background: "rgba(0,212,255,0.08)", color: "rgba(0,212,255,0.3)", cursor: "not-allowed" }
                : {
                    background: "linear-gradient(135deg, #0066ff, #00d4ff)",
                    color: "#000814",
                    boxShadow: "0 0 20px rgba(0,212,255,0.3)",
                  }
            }
            onMouseEnter={(e) => {
              if (!loading && password.trim()) {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(0,212,255,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && password.trim()) {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,212,255,0.3)";
              }
            }}
          >
            {loading ? <Spinner /> : "ENTRAR"}
          </button>
        </div>
      </form>
    </div>
  );
}
