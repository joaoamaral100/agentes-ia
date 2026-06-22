"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, getAllProfiles, setUserApproval, Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function Badge({ approved }: { approved: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: approved ? "rgba(0,212,100,0.12)" : "rgba(248,113,113,0.12)",
        color: approved ? "#4ade80" : "#f87171",
        border: `1px solid ${approved ? "rgba(0,212,100,0.25)" : "rgba(248,113,113,0.25)"}`,
      }}
    >
      {approved ? "APROVADO" : "PENDENTE"}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "approve" | "reject";
  disabled?: boolean;
}) {
  const colors =
    variant === "approve"
      ? {
          bg: "rgba(0,212,100,0.1)",
          border: "rgba(0,212,100,0.3)",
          color: "#4ade80",
          hover: "rgba(0,212,100,0.2)",
        }
      : {
          bg: "rgba(248,113,113,0.1)",
          border: "rgba(248,113,113,0.3)",
          color: "#f87171",
          hover: "rgba(248,113,113,0.2)",
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
        letterSpacing: "0.05em",
        background: disabled ? "rgba(255,255,255,0.04)" : colors.bg,
        border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : colors.border}`,
        color: disabled ? "rgba(255,255,255,0.2)" : colors.color,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background = colors.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background = colors.bg;
      }}
    >
      {label}
    </button>
  );
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const fetchProfiles = useCallback(async () => {
    const data = await getAllProfiles();
    setProfiles(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
        await fetchProfiles();
      }
      setLoading(false);
    });
  }, [fetchProfiles]);

  async function handleApproval(userId: string, approved: boolean) {
    setActionLoading(userId);
    try {
      await setUserApproval(userId, approved);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, approved } : p))
      );
    } catch {
      // silently ignore — user sees no change
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = profiles.filter((p) => {
    if (filter === "pending") return !p.approved && !p.is_admin;
    if (filter === "approved") return p.approved || p.is_admin;
    return true;
  });

  // ── States ──────────────────────────────────────────────

  if (loading || currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#000814" }}>
        <div style={{ color: "rgba(0,212,255,0.5)", fontSize: "13px", letterSpacing: "0.1em" }}>
          CARREGANDO...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#000814" }}>
        <div style={{ color: "#f87171", fontSize: "13px" }}>
          Você precisa estar logado.{" "}
          <a href="/" style={{ color: "#00d4ff" }}>Voltar</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#000814" }}>
        <div style={{ color: "#f87171", fontSize: "13px" }}>
          Acesso negado. Você não tem permissão de administrador.{" "}
          <a href="/" style={{ color: "#00d4ff" }}>Voltar</a>
        </div>
      </div>
    );
  }

  const pendingCount = profiles.filter((p) => !p.approved && !p.is_admin).length;

  return (
    <div
      className="dot-grid min-h-screen"
      style={{ background: "#000814", padding: "32px 16px" }}
    >
      {/* Header */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-[22px] font-bold tracking-[6px]"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #80ccee 40%, #00d4ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              JARVIS ADMIN
            </h1>
            <p style={{ color: "rgba(74,158,187,0.5)", fontSize: "12px", marginTop: "4px" }}>
              Gerenciamento de usuários
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span
                style={{
                  background: "rgba(248,113,113,0.15)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
                  borderRadius: "999px",
                  padding: "3px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
            <a
              href="/"
              style={{
                color: "rgba(0,212,255,0.6)",
                fontSize: "12px",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#00d4ff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,212,255,0.6)")}
            >
              ← Voltar ao sistema
            </a>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => {
            const labels = { pending: "Pendentes", approved: "Aprovados", all: "Todos" };
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
                  background: active ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                  color: active ? "#00d4ff" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
            background: "rgba(0,12,30,0.7)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 120px 140px",
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,212,255,0.03)",
            }}
          >
            {["E-mail", "Cadastrado em", "Status", "Ações"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "rgba(0,212,255,0.4)",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.2)",
                fontSize: "13px",
              }}
            >
              Nenhum usuário encontrado.
            </div>
          ) : (
            filtered.map((profile, i) => (
              <div
                key={profile.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px 120px 140px",
                  padding: "14px 20px",
                  alignItems: "center",
                  borderBottom:
                    i < filtered.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(0,212,255,0.03)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                {/* Email */}
                <div>
                  <span style={{ color: "#e0f4ff", fontSize: "13px" }}>
                    {profile.email}
                  </span>
                  {profile.is_admin && (
                    <span
                      style={{
                        marginLeft: "8px",
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
                </div>

                {/* Date */}
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                </span>

                {/* Status */}
                <Badge approved={profile.approved || profile.is_admin} />

                {/* Actions */}
                <div className="flex gap-2">
                  {!profile.is_admin && (
                    <>
                      {!profile.approved && (
                        <ActionButton
                          label="Aprovar"
                          variant="approve"
                          disabled={actionLoading === profile.id}
                          onClick={() => handleApproval(profile.id, true)}
                        />
                      )}
                      {profile.approved && (
                        <ActionButton
                          label="Revogar"
                          variant="reject"
                          disabled={actionLoading === profile.id}
                          onClick={() => handleApproval(profile.id, false)}
                        />
                      )}
                    </>
                  )}
                  {profile.is_admin && (
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <p style={{ marginTop: "16px", color: "rgba(255,255,255,0.15)", fontSize: "11px", textAlign: "center" }}>
          {profiles.length} usuário{profiles.length !== 1 ? "s" : ""} no total
        </p>
      </div>
    </div>
  );
}
