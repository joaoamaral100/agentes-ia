"use client";

import { useState } from "react";
import { supabase, setActiveSession } from "@/lib/supabase";

// ─── Eye icon ─────────────────────────────────────────────────────────────────
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
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LoginScreenProps {
  onSuccess: () => void;
}

type Mode = "signin" | "signup" | "forgot";

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode]                 = useState<Mode>("signin");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [info, setInfo]                 = useState("");
  const [loading, setLoading]           = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);

  function reset() { setError(""); setInfo(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (mode !== "forgot" && !password.trim()) return;

    setLoading(true);
    reset();

    try {
      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;

        if (data.user) {
          const token = crypto.randomUUID();
          const saved = await setActiveSession(token);
          if (saved) localStorage.setItem("jarvis_session_token", token);
        }
        onSuccess();
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) {
          onSuccess();
        } else {
          setInfo(
            "Conta criada! Verifique seu e-mail para confirmar. " +
            "Se não chegar, acesse Supabase Dashboard → Authentication → Users " +
            "e confirme manualmente ou reenvie o link de confirmação."
          );
          setMode("signin");
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email);
        if (err) throw err;
        setInfo("Enviamos um link de redefinição para seu e-mail.");
        setMode("signin");
      }
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : "Erro desconhecido."));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && email.trim().length > 0 && (mode === "forgot" || password.trim().length > 0);

  const titles: Record<Mode, { heading: string; sub: string; btn: string }> = {
    signin: { heading: "Bem-vindo de volta",   sub: "Entre com sua conta para continuar",  btn: "ENTRAR"      },
    signup: { heading: "Criar conta",          sub: "Preencha os dados para se cadastrar", btn: "CRIAR CONTA" },
    forgot: { heading: "Recuperar acesso",     sub: "Enviaremos um link ao seu e-mail",    btn: "ENVIAR LINK" },
  };
  const { heading, sub, btn } = titles[mode];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#0a0e27",
        animation: "page-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <style>{`
        @keyframes page-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes card-rise {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logo-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(0,217,255,0.5)) drop-shadow(0 0 60px rgba(0,217,255,0.15)); }
          50%       { filter: drop-shadow(0 0 30px rgba(0,217,255,0.8)) drop-shadow(0 0 80px rgba(0,217,255,0.25)); }
        }
        @keyframes orb-a {
          0%, 100% { transform: translate(0,0) scale(1); }
          40%       { transform: translate(40px,-30px) scale(1.08); }
          70%       { transform: translate(-20px,35px) scale(0.95); }
        }
        @keyframes orb-b {
          0%, 100% { transform: translate(0,0) scale(1); }
          35%       { transform: translate(-50px,25px) scale(1.06); }
          65%       { transform: translate(30px,-40px) scale(0.96); }
        }
        @keyframes dot-grid-scroll {
          from { background-position: 0 0; }
          to   { background-position: 28px 28px; }
        }
        @keyframes input-appear {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .login-input-wrap:focus-within .login-label {
          color: rgba(0,217,255,0.8) !important;
        }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,217,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        animation: "dot-grid-scroll 12s linear infinite",
        zIndex: 0,
      }} />

      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {/* Big blue orb top-left */}
        <div style={{
          position: "absolute", top: "-220px", left: "-220px",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,80,200,0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orb-a 28s ease-in-out infinite",
        }} />
        {/* Cyan orb bottom-right */}
        <div style={{
          position: "absolute", bottom: "-200px", right: "-200px",
          width: "650px", height: "650px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,217,255,0.12) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orb-b 32s ease-in-out infinite",
        }} />
        {/* Subtle teal center */}
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          width: "500px", height: "500px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,150,255,0.06) 0%, transparent 60%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Scan line */}
      <div className="scan-line" />

      {/* Card wrapper */}
      <div
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: "420px",
          padding: "20px 16px",
          animation: "card-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
        }}
      >

        {/* ── HERO ── */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>

          {/* Decorative ring behind logo */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{
              position: "absolute",
              width: "96px", height: "96px",
              borderRadius: "50%",
              border: "1px solid rgba(0,217,255,0.15)",
              borderTopColor: "rgba(0,217,255,0.5)",
              animation: "ring-cw 10s linear infinite",
            }} />
            <div style={{
              position: "absolute",
              width: "116px", height: "116px",
              borderRadius: "50%",
              border: "1px solid rgba(0,217,255,0.07)",
              borderBottomColor: "rgba(0,217,255,0.25)",
              animation: "ring-ccw 16s linear infinite",
            }} />

            {/* Logo glow disc */}
            <div style={{
              width: "72px", height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, rgba(0,128,255,0.12), rgba(0,217,255,0.06))",
              border: "1px solid rgba(0,217,255,0.18)",
              boxShadow: "0 0 30px rgba(0,217,255,0.1), inset 0 0 20px rgba(0,217,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 8px rgba(0,217,255,0.6))" }}>
                <circle cx="12" cy="12" r="3" fill="#00d9ff" />
                <circle cx="12" cy="12" r="6" stroke="rgba(0,217,255,0.4)" strokeWidth="1" fill="none" />
                <circle cx="12" cy="12" r="10" stroke="rgba(0,217,255,0.15)" strokeWidth="0.5" fill="none" />
                <line x1="12" y1="2" x2="12" y2="6"  stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="2" y1="12" x2="6" y2="12"  stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="18" y1="12" x2="22" y2="12" stroke="#00d9ff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* JARVIS wordmark */}
          <div
            style={{
              fontSize: "clamp(40px, 8vw, 64px)",
              fontWeight: 800,
              letterSpacing: "16px",
              lineHeight: 1,
              background: "linear-gradient(135deg, #ffffff 0%, #c0e0ff 35%, #00d9ff 70%, #00f0ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "logo-glow 4s ease-in-out infinite",
              marginBottom: "10px",
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            JARVIS
          </div>

          <div style={{
            fontSize: "11px",
            letterSpacing: "4px",
            color: "rgba(0,217,255,0.35)",
            fontFamily: "monospace",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}>
            TikTok Shopping · AI Platform
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.25))" }} />
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,217,255,0.5)", boxShadow: "0 0 6px rgba(0,217,255,0.8)" }} />
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(90deg, rgba(0,217,255,0.25), transparent)" }} />
          </div>
        </div>

        {/* ── CARD ── */}
        <div
          style={{
            background: "rgba(10,14,39,0.88)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(26,37,85,0.9)",
            borderRadius: "16px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,217,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px rgba(0,80,200,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,128,255,0.6) 30%, rgba(0,217,255,0.9) 50%, rgba(0,128,255,0.6) 70%, transparent 100%)",
          }} />

          <div style={{ padding: "40px 40px 36px" }}>

            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#e0e6ff",
                marginBottom: "6px",
                letterSpacing: "-0.2px",
              }}>
                {heading}
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(160,170,192,0.6)", lineHeight: "1.5" }}>
                {sub}
              </p>
            </div>

            {/* Feedback banners */}
            {info && (
              <div style={{
                marginBottom: "20px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "rgba(0,217,255,0.05)",
                border: "1px solid rgba(0,217,255,0.14)",
                color: "#7dd3fc",
                fontSize: "12px",
                lineHeight: "1.65",
              }}>
                {info}
              </div>
            )}
            {error && (
              <div style={{
                marginBottom: "20px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.1)",
                border: "1.5px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: "1.6",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                boxShadow: "0 0 16px rgba(239,68,68,0.08)",
              }}>
                <span style={{ flexShrink: 0, marginTop: "1px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5" />
                    <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                {error}
              </div>
            )}

            {/* ── Email field ── */}
            <div style={{ marginBottom: "16px", animation: "input-appear 0.5s 0.2s both" }}>
              <label className="login-label" style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: emailFocused ? "rgba(0,217,255,0.8)" : "rgba(0,217,255,0.4)",
                marginBottom: "8px",
                transition: "color 0.2s ease",
              }}>
                E-mail
              </label>
              <div
                className="login-input-wrap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "52px",
                  borderRadius: "10px",
                  background: emailFocused ? "rgba(0,20,60,0.9)" : "rgba(15,21,53,0.7)",
                  border: emailFocused
                    ? "1.5px solid rgba(0,217,255,0.6)"
                    : "1.5px solid rgba(26,37,85,0.9)",
                  boxShadow: emailFocused
                    ? "0 0 0 3px rgba(0,217,255,0.08), 0 0 20px rgba(0,217,255,0.1)"
                    : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); reset(); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 18px",
                    fontSize: "15px",
                    color: "#e0e6ff",
                    WebkitAppearance: "none",
                  }}
                />
              </div>
            </div>

            {/* ── Password field ── */}
            {mode !== "forgot" && (
              <div style={{ marginBottom: "20px", animation: "input-appear 0.5s 0.3s both" }}>
                <label style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: passFocused ? "rgba(0,217,255,0.8)" : "rgba(0,217,255,0.4)",
                  marginBottom: "8px",
                  transition: "color 0.2s ease",
                }}>
                  Senha
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "52px",
                    borderRadius: "10px",
                    background: passFocused ? "rgba(0,20,60,0.9)" : "rgba(15,21,53,0.7)",
                    border: passFocused
                      ? "1.5px solid rgba(0,217,255,0.6)"
                      : "1.5px solid rgba(26,37,85,0.9)",
                    boxShadow: passFocused
                      ? "0 0 0 3px rgba(0,217,255,0.08), 0 0 20px rgba(0,217,255,0.1)"
                      : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); reset(); }}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Senha de acesso"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    style={{
                      flex: 1,
                      height: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "0 0 0 18px",
                      fontSize: "15px",
                      color: "#e0e6ff",
                      WebkitAppearance: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      height: "100%",
                      padding: "0 16px",
                      flexShrink: 0,
                      background: "transparent",
                      border: "none",
                      color: showPassword ? "#00d9ff" : "rgba(160,170,192,0.4)",
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
            )}

            {/* Forgot link */}
            {mode === "signin" && (
              <div style={{ textAlign: "right", marginBottom: "24px", marginTop: "-8px" }}>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); reset(); }}
                  style={{
                    fontSize: "12px",
                    color: "rgba(0,217,255,0.4)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,217,255,0.85)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,217,255,0.4)")}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              disabled={!canSubmit}
              style={{
                width: "100%",
                height: "54px",
                borderRadius: "10px",
                border: "none",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "2px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative",
                overflow: "hidden",
                ...(canSubmit
                  ? {
                      background: "linear-gradient(135deg, #0055cc 0%, #0080ff 45%, #00bfff 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 24px rgba(0,128,255,0.35), 0 0 0 1px rgba(0,217,255,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }
                  : {
                      background: "rgba(20,28,58,0.7)",
                      color: "rgba(255,255,255,0.2)",
                      boxShadow: "none",
                    }),
              }}
              onMouseEnter={(e) => {
                if (!canSubmit) return;
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "linear-gradient(135deg, #0066dd 0%, #0090ff 45%, #00d0ff 100%)",
                  boxShadow: "0 8px 40px rgba(0,128,255,0.55), 0 0 0 1px rgba(0,217,255,0.25), 0 0 30px rgba(0,217,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                  transform: "translateY(-2px)",
                });
              }}
              onMouseLeave={(e) => {
                if (!canSubmit) return;
                Object.assign((e.currentTarget as HTMLElement).style, {
                  background: "linear-gradient(135deg, #0055cc 0%, #0080ff 45%, #00bfff 100%)",
                  boxShadow: "0 4px 24px rgba(0,128,255,0.35), 0 0 0 1px rgba(0,217,255,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
                  transform: "translateY(0)",
                });
              }}
              onMouseDown={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(0.98)";
              }}
              onMouseUp={(e) => {
                if (!canSubmit) return;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1)";
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <Spinner /> Aguarde...
                </span>
              ) : btn}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(26,37,85,0.9)" }} />
              <span style={{ fontSize: "11px", color: "rgba(160,170,192,0.3)", letterSpacing: "0.05em" }}>ou</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(26,37,85,0.9)" }} />
            </div>

            {/* Mode switcher */}
            <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(160,170,192,0.5)" }}>
              {mode === "signin" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); reset(); }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "rgba(0,217,255,0.75)",
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d9ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,217,255,0.75)")}
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); reset(); }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "rgba(0,217,255,0.75)",
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d9ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,217,255,0.75)")}
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Bottom accent line */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.08), transparent)",
          }} />

          <div style={{
            padding: "12px 40px",
            textAlign: "center",
            background: "rgba(0,217,255,0.015)",
          }}>
            <p style={{
              fontSize: "10px",
              letterSpacing: "1.5px",
              color: "rgba(160,170,192,0.2)",
              fontFamily: "monospace",
            }}>
              ACESSO RESTRITO · APENAS CONTAS AUTORIZADAS
            </p>
          </div>
        </div>

        {/* Below-card status */}
        <div style={{ textAlign: "center", marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <div className="status-online" style={{ width: "6px", height: "6px", borderRadius: "50%" }} />
          <span style={{ fontSize: "10px", letterSpacing: "2.5px", color: "rgba(34,197,94,0.5)", fontFamily: "monospace" }}>
            SISTEMA ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))          return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed"))                return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered"))            return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least"))       return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email"))          return "E-mail inválido. Verifique o formato.";
  if (msg.includes("Email rate limit exceeded"))         return "Muitas tentativas. Aguarde alguns minutos.";
  if (msg.includes("signup_disabled"))                   return "Cadastro desativado pelo administrador.";
  if (msg.includes("over_email_send_rate_limit"))        return "Limite de envio atingido. Tente em 1 minuto.";
  if (msg.includes("For security purposes"))             return "Aguarde alguns segundos antes de tentar novamente.";
  if (msg.includes("Token has expired"))                 return "Link expirado. Solicite um novo.";
  if (msg.includes("User not found"))                    return "Conta não encontrada.";
  if (msg.includes("Network") || msg.includes("fetch")) return "Falha de conexão. Verifique sua internet.";
  return msg;
}
