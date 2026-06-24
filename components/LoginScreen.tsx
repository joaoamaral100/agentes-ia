"use client";

import { useState } from "react";

function JarvisWordmark() {
  return (
    <span
      className="block text-center text-[28px] font-bold tracking-[14px]"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #80ccee 40%, #00d4ff 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 20px rgba(0,212,255,0.3))",
      }}
    >
      JARVIS
    </span>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
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
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 400));

    const correct = process.env.NEXT_PUBLIC_APP_PASSWORD ?? "bext2024";

    if (password === correct) {
      localStorage.setItem("jarvis_auth", "true");
      onSuccess();
    } else {
      setError("Senha incorreta. Tente novamente.");
      setPassword("");
    }

    setLoading(false);
  }

  const canSubmit = !loading && password.trim().length > 0;

  return (
    <div
      className="dot-grid relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#000814" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(0,12,30,0.7)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <JarvisWordmark />
          </div>

          {/* Title */}
          <div className="mb-6 text-center">
            <h1 className="mb-1 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Acesso Restrito
            </h1>
            <p className="text-[13px]" style={{ color: "rgba(74,158,187,0.65)" }}>
              Digite a senha para continuar
            </p>
          </div>

          {/* Password input */}
          <div className="mb-4">
            <div
              className="flex items-center rounded-xl"
              style={{
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.2)",
                height: "52px",
              }}
              onFocusCapture={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border = "1px solid rgba(0,212,255,0.5)";
                el.style.boxShadow = "0 0 0 1px rgba(0,212,255,0.12), 0 0 16px rgba(0,212,255,0.08)";
              }}
              onBlurCapture={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border = "1px solid rgba(0,212,255,0.2)";
                el.style.boxShadow = "";
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Senha de acesso"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 bg-transparent outline-none"
                style={{
                  color: "#e0f4ff",
                  fontSize: "16px",
                  padding: "0 16px",
                  height: "100%",
                  WebkitAppearance: "none",
                  borderRadius: "12px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  color: showPassword ? "#00d4ff" : "#4a9ebb",
                  padding: "0 14px",
                  height: "100%",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                  flexShrink: 0,
                }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {error && (
              <p className="mt-2 rounded-lg px-3 py-2 text-[12px]"
                style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl font-semibold tracking-widest"
            style={{
              height: "52px",
              fontSize: "14px",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              transition: "all 0.2s ease",
              ...(canSubmit
                ? {
                    background: "linear-gradient(135deg, #1a44ff 0%, #0088cc 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(0,100,255,0.35)",
                  }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }),
            }}
            onMouseEnter={(e) => {
              if (canSubmit)
                Object.assign((e.currentTarget as HTMLElement).style, {
                  boxShadow: "0 6px 28px rgba(0,100,255,0.5)",
                  transform: "translateY(-1px)",
                });
            }}
            onMouseLeave={(e) => {
              if (canSubmit)
                Object.assign((e.currentTarget as HTMLElement).style, {
                  boxShadow: "0 4px 20px rgba(0,100,255,0.35)",
                  transform: "translateY(0)",
                });
            }}
          >
            {loading ? <Spinner /> : "ENTRAR"}
          </button>
        </div>
      </form>
    </div>
  );
}
