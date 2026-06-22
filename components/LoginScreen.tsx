"use client";

import { useState } from "react";
import { supabase, getProfile } from "@/lib/supabase";

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

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  suffix,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(0,212,255,0.5)" }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl transition-all"
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
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
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
        {suffix}
      </div>
    </div>
  );
}

interface LoginScreenProps {
  onSuccess: () => void;
}

type Mode = "signin" | "signup" | "forgot";

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setError("");
    setInfo("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (mode !== "forgot" && !password.trim()) return;

    setLoading(true);
    reset();

    try {
      if (mode === "signin") {
        const { data: authData, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;

        const profile = await getProfile(authData.user.id);
        if (profile && !profile.approved && !profile.is_admin) {
          await supabase.auth.signOut();
          setError("Sua conta está aguardando aprovação. Você será notificado quando for aprovado.");
          setLoading(false);
          return;
        }
        onSuccess();
      } else if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Conta criada! Verifique seu e-mail para confirmar o cadastro. Após confirmação, aguarde aprovação do administrador para acessar o sistema.");
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email);
        if (err) throw err;
        setInfo("Enviamos um link de redefinição para seu e-mail.");
        setMode("signin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      setError(translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !loading &&
    email.trim().length > 0 &&
    (mode === "forgot" || password.trim().length > 0);

  const titles: Record<Mode, { heading: string; sub: string; btn: string }> = {
    signin:  { heading: "Acesso Restrito",    sub: "Entre com sua conta",              btn: "ENTRAR" },
    signup:  { heading: "Criar Conta",        sub: "Cadastre-se para continuar",       btn: "CRIAR CONTA" },
    forgot:  { heading: "Recuperar Acesso",   sub: "Enviaremos um link ao seu e-mail", btn: "ENVIAR LINK" },
  };
  const { heading, sub, btn } = titles[mode];

  const eyeToggle = (
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
  );

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
              {heading}
            </h1>
            <p className="text-[13px]" style={{ color: "rgba(74,158,187,0.65)" }}>
              {sub}
            </p>
          </div>

          {/* Feedback */}
          {info && (
            <p className="mb-4 rounded-lg px-4 py-2.5 text-[12px]"
               style={{ background: "rgba(0,212,255,0.08)", color: "#7dd3fc", border: "1px solid rgba(0,212,255,0.15)" }}>
              {info}
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-lg px-4 py-2.5 text-[12px]"
               style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </p>
          )}

          {/* Email */}
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); reset(); }}
            placeholder="seu@email.com"
            autoComplete="email"
          />

          {/* Password (hidden in forgot mode) */}
          {mode !== "forgot" && (
            <Field
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(v) => { setPassword(v); reset(); }}
              placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Senha de acesso"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              suffix={eyeToggle}
            />
          )}

          {/* Forgot link */}
          {mode === "signin" && (
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => { setMode("forgot"); reset(); }}
                className="text-[12px] transition-colors"
                style={{ color: "rgba(0,212,255,0.5)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.85)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.5)")}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

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
            {loading ? <Spinner /> : btn}
          </button>

          {/* Mode switcher */}
          <div className="mt-5 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {mode === "signin" ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); reset(); }}
                  className="font-semibold transition-colors"
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
                  className="font-semibold transition-colors"
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
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "E-mail inválido.";
  return msg;
}
