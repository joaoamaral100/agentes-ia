"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, ensureProfile } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";

// ── Approval states ──────────────────────────────────────────────────────────
// "loading"  → getSession() or profiles query in flight
// "approved" → profiles.approved = true OR profiles.is_admin = true
// "pending"  → profiles row exists but approved = false
type ApprovalStatus = "loading" | "approved" | "pending";

// ── Black screen shown while any async gate is resolving ─────────────────────
function LoadingGate() {
  return <div style={{ position: "fixed", inset: 0, background: "#000814" }} />;
}

// ── Screen shown when another device took over the session ────────────────────
function KickedOutScreen({ onContinue }: { onContinue: () => void }) {
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
            border: "1px solid rgba(248,113,113,0.2)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <span
            className="mb-8 block text-center text-[28px] font-bold tracking-[14px]"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #80ccee 40%, #00d4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            JARVIS
          </span>

          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="mb-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            Sessão encerrada
          </div>
          <p className="mb-7 text-[13px] leading-relaxed" style={{ color: "rgba(74,158,187,0.65)" }}>
            Sua conta foi acessada em outro dispositivo. Você foi desconectado automaticamente.
          </p>

          <button
            onClick={onContinue}
            className="w-full rounded-xl text-[13px] font-semibold"
            style={{
              height: "48px",
              background: "linear-gradient(135deg, #1a44ff 0%, #0088cc 100%)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,100,255,0.35)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                boxShadow: "0 6px 28px rgba(0,100,255,0.5)",
                transform: "translateY(-1px)",
              })
            }
            onMouseLeave={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                boxShadow: "0 4px 20px rgba(0,100,255,0.35)",
                transform: "translateY(0)",
              })
            }
          >
            Entrar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screen shown to authenticated-but-not-yet-approved users ─────────────────
function PendingScreen({ onRetry }: { onRetry: () => void }) {
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
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="rgba(0,212,255,0.7)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="18" cy="6" r="2" fill="rgba(251,191,36,0.9)" />
              <path
                d="M18 4v-1M18 8v1M16 6h-1M20 6h1M16.6 4.6l-.7-.7M19.4 7.4l.7.7M19.4 4.6l.7-.7M16.6 7.4l-.7.7"
                stroke="rgba(251,191,36,0.7)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            className="mb-2 text-[15px] font-semibold"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Acesso em análise
          </div>
          <p
            className="mb-7 text-[13px] leading-relaxed"
            style={{ color: "rgba(74,158,187,0.65)" }}
          >
            Sua conta foi criada e está aguardando aprovação do administrador. Você receberá acesso
            em breve.
          </p>

          {/* Retry */}
          <button
            onClick={onRetry}
            className="mb-3 w-full rounded-xl text-[13px] font-semibold"
            style={{
              height: "44px",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "rgba(0,212,255,0.7)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(0,212,255,0.15)",
                color: "#00d4ff",
              })
            }
            onMouseLeave={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(0,212,255,0.08)",
                color: "rgba(0,212,255,0.7)",
              })
            }
          >
            Verificar novamente
          </button>

          {/* Sign out */}
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full rounded-xl text-[13px] font-semibold"
            style={{
              height: "44px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
              })
            }
            onMouseLeave={(e) =>
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.4)",
              })
            }
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main auth wrapper ────────────────────────────────────────────────────────

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  // authReady: true once getSession() has resolved (prevents flash of login screen)
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser]           = useState<User | null>(null);
  const [approval, setApproval]   = useState<ApprovalStatus>("loading");
  const [booted, setBooted]       = useState(false);
  const [kickedOut, setKickedOut] = useState(false);

  // Keep a ref so retryApproval doesn't close over a stale user value
  const userRef = useRef<User | null>(null);

  // ── Query the profiles table to determine access ─────────────────────────
  async function checkApproval(u: User) {
    console.log("[Auth] checkApproval →", u.email);

    const { data, error } = await supabase
      .from("profiles")
      .select("approved, is_admin")
      .eq("id", u.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Row not found — trigger didn't fire for this account; create it now
        console.log("[Auth] no profile row, calling ensureProfile...");
        const created = await ensureProfile(u.id, u.email ?? "");
        // Profile was just created with approved=false → pending
        // If creation also failed (permissions/table missing) → fail open
        setApproval(created ? "pending" : "approved");
        return;
      }

      // Any other error (table doesn't exist, bad key, network) → fail open
      // so the admin isn't permanently locked out before the SQL has been run
      console.log("[Auth] profiles query error:", error.code, error.message, "→ failing open");
      setApproval("approved");
      return;
    }

    const ok = data.is_admin === true || data.approved === true;
    console.log("[Auth] profiles result →", ok ? "APPROVED" : "PENDING", {
      approved: data.approved,
      is_admin: data.is_admin,
    });
    setApproval(ok ? "approved" : "pending");
  }

  // ── "Verificar novamente" button handler ─────────────────────────────────
  async function retryApproval() {
    if (!userRef.current) return;
    setApproval("loading");
    await checkApproval(userRef.current);
  }

  // ── Subscribe to auth state ───────────────────────────────────────────────
  useEffect(() => {
    // 1. Read persisted session from localStorage on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      const u = session?.user ?? null;
      console.log("[Auth] getSession →", u?.email ?? "no session", error?.message ?? "ok");
      userRef.current = u;
      setUser(u);
      setAuthReady(true); // gate lifts once we know whether there's a session
      if (u) checkApproval(u);
    });

    // 2. Keep state in sync with any auth event (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      console.log("[Auth] onAuthStateChange →", event, u?.email ?? "signed out");
      userRef.current = u;
      setUser(u);
      if (u) {
        setApproval("loading");
        checkApproval(u);
      }
      // When user signs out, AppWrapper re-renders with !user → LoginScreen
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Single-session enforcement ────────────────────────────────────────────
  // Only runs when the user is fully authenticated AND approved.
  // Polls every 15 s to check whether another device has taken over the session.
  useEffect(() => {
    if (!user || approval !== "approved") return;

    const userId = user.id;

    async function verifySingleSession() {
      const localToken = localStorage.getItem("jarvis_session_token");
      if (!localToken) return; // this device has no token → skip (no kick)

      const { data, error } = await supabase
        .from("profiles")
        .select("active_session_id")
        .eq("id", userId)
        .single();

      if (error || !data) return; // DB error or missing row → never kick on uncertainty
      if (!data.active_session_id) return; // null → column not yet set, skip

      if (data.active_session_id !== localToken) {
        console.log("[Auth] session taken by another device — signing out");
        setKickedOut(true);
        await supabase.auth.signOut();
        // signOut triggers onAuthStateChange → setUser(null)
        // cleanup below clears the interval automatically
      }
    }

    verifySingleSession(); // immediate check on becoming approved
    const interval = setInterval(verifySingleSession, 15_000);

    return () => clearInterval(interval);
  // user?.id avoids re-running on token refresh (object ref changes but id stays the same)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, approval]);

  // ── Render gates (evaluated in order) ────────────────────────────────────

  // Gate 1: waiting for getSession() to finish
  if (!authReady) return <LoadingGate />;

  // Gate 2: evicted by another device login
  if (kickedOut) return <KickedOutScreen onContinue={() => setKickedOut(false)} />;

  // Gate 3: no session → login form
  if (!user) return <LoginScreen onSuccess={() => {}} />;

  // Gate 4: session found, profiles query in flight
  if (approval === "loading") return <LoadingGate />;

  // Gate 5: authenticated but not approved
  if (approval === "pending") return <PendingScreen onRetry={retryApproval} />;

  // Gate 6: authenticated + approved → boot animation then app
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
