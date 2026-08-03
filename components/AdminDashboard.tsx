"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, getAllProfiles, setUserApproval, Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ approved, isAdmin }: { approved: boolean; isAdmin: boolean }) {
  const effective = approved || isAdmin;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: effective ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
        color: effective ? "#4ade80" : "#fbbf24",
        border: `1px solid ${effective ? "rgba(74,222,128,0.25)" : "rgba(251,191,36,0.25)"}`,
      }}
    >
      {effective ? "APROVADO" : "PENDENTE"}
    </span>
  );
}

function ActionBtn({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: "approve" | "revoke";
  disabled: boolean;
  onClick: () => void;
}) {
  const c =
    variant === "approve"
      ? {
          bg: "rgba(74,222,128,0.08)",
          border: "rgba(74,222,128,0.3)",
          text: "#4ade80",
          hover: "rgba(74,222,128,0.18)",
        }
      : {
          bg: "rgba(248,113,113,0.08)",
          border: "rgba(248,113,113,0.3)",
          text: "#f87171",
          hover: "rgba(248,113,113,0.18)",
        };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 14px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s ease",
        background: disabled ? "rgba(26,37,85,0.4)" : c.bg,
        border: `1px solid ${disabled ? "rgba(26,37,85,0.8)" : c.border}`,
        color: disabled ? "rgba(160,170,192,0.2)" : c.text,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = c.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = c.bg;
      }}
    >
      {label}
    </button>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#0a0e27" }}
    >
      <div style={{ textAlign: "center" }}>{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading]             = useState(true);
  const [currentUser, setCurrentUser]     = useState<User | null>(null);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [profiles, setProfiles]           = useState<Profile[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter]               = useState<"all" | "pending" | "approved">("pending");

  const loadProfiles = useCallback(async () => {
    const data = await getAllProfiles();
    setProfiles(data);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setCurrentUser(u);

      if (!u) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", u.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
        await loadProfiles();
      }

      setLoading(false);
    }

    init();
  }, [loadProfiles]);

  async function handleApproval(userId: string, approve: boolean) {
    setActionLoading(userId);
    try {
      await setUserApproval(userId, approve);
      await loadProfiles(); // reload list immediately
    } catch {
      // DB error — list stays as-is
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <CenterMessage>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid rgba(0,217,255,0.12)",
            borderTop: "2px solid #00d9ff",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "rgba(0,217,255,0.4)", fontSize: "12px", letterSpacing: "0.1em" }}>
          CARREGANDO...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </CenterMessage>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <CenterMessage>
        <p style={{ color: "#f87171", marginBottom: "12px", fontSize: "14px" }}>
          Faça login primeiro.
        </p>
        <a href="/" style={{ color: "#00d9ff", fontSize: "13px" }}>
          ← Voltar ao app
        </a>
      </CenterMessage>
    );
  }

  // ── Not admin ─────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <CenterMessage>
        <p style={{ color: "#f87171", marginBottom: "12px", fontSize: "14px" }}>
          Acesso negado. Você não tem permissão de administrador.
        </p>
        <a href="/" style={{ color: "#00d9ff", fontSize: "13px" }}>
          ← Voltar ao app
        </a>
      </CenterMessage>
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total    = profiles.length;
  const nApproved = profiles.filter((p) => p.approved || p.is_admin).length;
  const nPending  = profiles.filter((p) => !p.approved && !p.is_admin).length;

  const filtered = profiles.filter((p) => {
    if (filter === "pending")  return !p.approved && !p.is_admin;
    if (filter === "approved") return p.approved || p.is_admin;
    return true;
  });

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="dot-grid min-h-screen"
      style={{ background: "#0a0e27", padding: "32px 16px" }}
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-[22px] font-bold tracking-[6px]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #80c8ee 40%, #00d9ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ADMINISTRAÇÃO
            </h1>
            <p style={{ marginTop: "6px", fontSize: "12px" }}>
              <span style={{ color: "rgba(160,170,192,0.55)" }}>{total} usuários</span>
              <span style={{ color: "#1a2555" }}> · </span>
              <span style={{ color: "#4ade80" }}>{nApproved} aprovados</span>
              <span style={{ color: "#1a2555" }}> · </span>
              <span style={{ color: "#fbbf24" }}>{nPending} pendentes</span>
            </p>
          </div>

          <a
            href="/"
            style={{
              color: "rgba(0,217,255,0.5)",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textDecoration: "none",
              paddingTop: "4px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d9ff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,217,255,0.5)")}
          >
            ← Voltar ao app
          </a>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => {
            const labels = {
              pending:  `Pendentes (${nPending})`,
              approved: `Aprovados (${nApproved})`,
              all:      `Todos (${total})`,
            };
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: active ? "rgba(0,217,255,0.1)" : "rgba(26,31,53,0.6)",
                  border: `1px solid ${active ? "rgba(0,217,255,0.35)" : "rgba(26,37,85,0.8)"}`,
                  color: active ? "#00d9ff" : "rgba(160,170,192,0.4)",
                }}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div
          style={{
            background: "rgba(15,21,53,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,217,255,0.14)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px 110px 160px",
              padding: "12px 20px",
              borderBottom: "1px solid rgba(26,37,85,0.9)",
              background: "rgba(0,217,255,0.03)",
            }}
          >
            {["E-mail", "Cadastrado em", "Status", "Ações"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "rgba(0,217,255,0.38)",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "rgba(160,170,192,0.25)",
                fontSize: "13px",
              }}
            >
              Nenhum usuário nesta categoria.
            </div>
          ) : (
            filtered.map((profile, i) => {
              const isOwnAccount = profile.id === currentUser.id;
              const busy         = actionLoading === profile.id;

              return (
                <div
                  key={profile.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px 110px 160px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid rgba(26,37,85,0.6)"
                        : "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(0,217,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  {/* Email */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      style={{
                        color: "#e0e6ff",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {profile.email}
                    </span>
                    {profile.is_admin && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          color: "#a78bfa",
                          background: "rgba(167,139,250,0.1)",
                          border: "1px solid rgba(167,139,250,0.2)",
                          borderRadius: "4px",
                          padding: "1px 6px",
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                    {isOwnAccount && (
                      <span style={{ flexShrink: 0, fontSize: "10px", color: "rgba(160,170,192,0.25)" }}>
                        (você)
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span style={{ color: "rgba(160,170,192,0.35)", fontSize: "12px" }}>
                    {formatDate(profile.created_at)}
                  </span>

                  {/* Status */}
                  <StatusBadge approved={profile.approved} isAdmin={profile.is_admin} />

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isOwnAccount ? (
                      // Never let admin revoke their own access
                      <span style={{ color: "rgba(160,170,192,0.15)", fontSize: "11px" }}>—</span>
                    ) : !profile.approved ? (
                      <ActionBtn
                        label={busy ? "..." : "Aprovar"}
                        variant="approve"
                        disabled={busy}
                        onClick={() => handleApproval(profile.id, true)}
                      />
                    ) : (
                      <ActionBtn
                        label={busy ? "..." : "Revogar acesso"}
                        variant="revoke"
                        disabled={busy}
                        onClick={() => handleApproval(profile.id, false)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p
          style={{
            marginTop: "16px",
            color: "rgba(160,170,192,0.15)",
            fontSize: "11px",
            textAlign: "center",
          }}
        >
          {total} usuário{total !== 1 ? "s" : ""} no total · administrado por {currentUser.email}
        </p>
      </div>
    </div>
  );
}
