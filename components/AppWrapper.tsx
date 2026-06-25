"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";

type ApprovalStatus = "loading" | "approved" | "pending";

function PendingScreen() {
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

      <div className="relative z-10 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(0,12,30,0.7)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo */}
          <span
            className="mb-8 block text-center text-[28px] font-bold tracking-[14px]"
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

          {/* Icon */}
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(0,212,255,0.7)" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(0,212,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="18" cy="6" r="2" fill="rgba(251,191,36,0.9)" />
              <path d="M18 4v-1M18 8v1M16 6h-1M20 6h1M16.6 4.6l-.7-.7M19.4 7.4l.7.7M19.4 4.6l.7-.7M16.6 7.4l-.7.7"
                stroke="rgba(251,191,36,0.7)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>

          <div className="mb-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            Acesso em análise
          </div>
          <p className="mb-7 text-[13px] leading-relaxed" style={{ color: "rgba(74,158,187,0.65)" }}>
            Sua conta foi criada e está aguardando aprovação do administrador. Você receberá acesso em breve.
          </p>

          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full rounded-xl text-[13px] font-semibold transition-all"
            style={{
              height: "44px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
              });
            }}
            onMouseLeave={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.4)",
              });
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null | undefined>(undefined);
  const [approval, setApproval] = useState<ApprovalStatus>("loading");
  const [booted, setBooted]     = useState(false);

  async function checkApproval(u: User) {
    const { data, error } = await supabase
      .from("profiles")
      .select("approved, is_admin")
      .eq("id", u.id)
      .single();

    if (error) {
      // profiles table doesn't exist yet → fail open so admin can still access
      console.log("[Auth] profiles check error (table may not exist yet):", error.message);
      setApproval("approved");
      return;
    }

    const ok = data?.is_admin === true || data?.approved === true;
    console.log("[Auth] approval check →", ok ? "approved" : "pending", data);
    setApproval(ok ? "approved" : "pending");
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[Auth] getSession →", session?.user?.email ?? "sem sessão", error?.message ?? "");
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkApproval(u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] onAuthStateChange →", event, session?.user?.email ?? "sem usuário");
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setApproval("loading");
        checkApproval(u);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── States ──────────────────────────────────────────────

  // Verificação inicial
  if (user === undefined || (user !== null && approval === "loading")) {
    return <div style={{ position: "fixed", inset: 0, background: "#000814" }} />;
  }

  // Não autenticado
  if (!user) {
    return <LoginScreen onSuccess={() => {}} />;
  }

  // Autenticado mas pendente
  if (approval === "pending") {
    return <PendingScreen />;
  }

  // Autenticado e aprovado
  return (
    <>
      <HudOverlay />
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      <div style={{ opacity: booted ? 1 : 0, height: "100%", transition: "opacity 0.45s ease" }}>
        {children}
      </div>
    </>
  );
}
