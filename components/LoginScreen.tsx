"use client";

import { useState } from "react";
import { supabase, setActiveSession } from "@/lib/supabase";

// ─── UI helpers ───────────────────────────────────────────────────────────────

function JarvisWordmark() {
  return (
    <span
      className="block text-center text-3xl font-bold tracking-[14px]"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #80ccee 40%, #00d4ff 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 24px rgba(0,212,255,0.35))",
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

function Field({
  label, type, value, onChange, placeholder, autoComplete, suffix,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; suffix?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        className="mb-1 block text-xs font-semibold uppercase"
        style={{ color: "rgba(0,212,255,0.5)", letterSpacing: "0.12em" }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-md transition duration-200"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          height: "50px",
        }}
        onFocusCapture={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.border = "1px solid rgba(0,212,255,0.4)";
          el.style.background = "rgba(0,212,255,0.04)";
          el.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.06)";
        }}
        onBlurCapture={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.border = "1px solid rgba(255,255,255,0.08)";
          el.style.background = "rgba(255,255,255,0.03)";
          el.style.boxShadow = "";
        }}
      >
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className="flex-1 bg-transparent text-base outline-none"
          style={{
            color: "#e0f4ff",
            padding: "0 16px",
            height: "100%",
            WebkitAppearance: "none",
            borderRadius: "8px",
          }}
        />
        {suffix}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LoginScreenProps {
  onSuccess: () => void;
}

type Mode = "signin" | "signup" | "forgot";

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode]               = useState<Mode>("signin");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [info, setInfo]               = useState("");
  const [loading, setLoading]         = useState(false);

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
          console.log("[Session] token gerado:", token.slice(0, 8) + "...");

          const saved = await setActiveSession(token);
          if (saved) {
            localStorage.setItem("jarvis_session_token", token);
            console.log("[Session] token salvo no localStorage ✓ chave=jarvis_session_token");
          } else {
            console.error("[Session] FALHOU — token NÃO salvo (RPC falhou). Sessão única inoperante.");
          }
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

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="transition duration-200"
      style={{
        color: showPassword ? "#00d4ff" : "rgba(74,158,187,0.5)",
        padding: "0 14px",
        height: "100%",
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <EyeIcon open={showPassword} />
    </button>
  );

  return (
    <div
      className="dot-grid relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: "#000814" }}
    >
      {/* Background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Hero */}
        <div className="mb-8 text-center">
          <JarvisWordmark />
          <p
            className="mt-3 text-xs uppercase"
            style={{ color: "rgba(0,212,255,0.35)", letterSpacing: "0.22em" }}
          >
            TikTok Shopping
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg"
          style={{
            background: "rgba(0,12,30,0.72)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="p-8">

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                {heading}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "rgba(74,158,187,0.55)" }}>
                {sub}
              </p>
            </div>

            {/* Feedback banners */}
            {info && (
              <div
                className="mb-4 rounded-md px-4 py-3 text-xs"
                style={{
                  background: "rgba(0,212,255,0.06)",
                  border: "1px solid rgba(0,212,255,0.12)",
                  color: "#7dd3fc",
                  lineHeight: "1.6",
                }}
              >
                {info}
              </div>
            )}
            {error && (
              <div
                className="mb-4 rounded-md px-4 py-3 text-xs"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#f87171",
                  lineHeight: "1.6",
                }}
              >
                {error}
              </div>
            )}

            {/* Email field */}
            <Field
              label="E-mail" type="email" value={email}
              onChange={(v) => { setEmail(v); reset(); }}
              placeholder="seu@email.com" autoComplete="email"
            />

            {/* Password field */}
            {mode !== "forgot" && (
              <Field
                label="Senha" type={showPassword ? "text" : "password"} value={password}
                onChange={(v) => { setPassword(v); reset(); }}
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Senha de acesso"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                suffix={eyeToggle}
              />
            )}

            {/* Forgot password link */}
            {mode === "signin" && (
              <div className="mb-4 text-right">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); reset(); }}
                  className="text-xs transition duration-200"
                  style={{ color: "rgba(0,212,255,0.4)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.8)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.4)")}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold tracking-widest transition duration-200"
              style={{
                height: "50px",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                ...(canSubmit
                  ? {
                      background: "linear-gradient(135deg, #1a44ff 0%, #0088cc 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 20px rgba(0,100,255,0.3)",
                      cursor: "pointer",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.2)",
                      cursor: "not-allowed",
                    }),
              }}
              onMouseEnter={(e) => {
                if (canSubmit)
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    boxShadow: "0 6px 28px rgba(0,100,255,0.45)",
                    transform: "translateY(-1px)",
                  });
              }}
              onMouseLeave={(e) => {
                if (canSubmit)
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    boxShadow: "0 4px 20px rgba(0,100,255,0.3)",
                    transform: "translateY(0)",
                  });
              }}
            >
              {loading ? <Spinner /> : btn}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>ou</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Mode switcher */}
            <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {mode === "signin" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); reset(); }}
                    className="font-semibold transition duration-200"
                    style={{ color: "rgba(0,212,255,0.7)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d4ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.7)")}
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
                    className="font-semibold transition duration-200"
                    style={{ color: "rgba(0,212,255,0.7)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d4ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.7)")}
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </div>
        </form>

        {/* Security footnote */}
        <p
          className="mt-6 text-center text-xs"
          style={{ color: "rgba(255,255,255,0.12)", letterSpacing: "0.05em" }}
        >
          Acesso restrito · Apenas contas autorizadas
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))     return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed"))           return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered"))       return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least"))  return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email"))     return "E-mail inválido.";
  if (msg.includes("Email rate limit exceeded"))    return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
