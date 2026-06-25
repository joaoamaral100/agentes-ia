import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// typeof window guard keeps this safe in SSR (layout.tsx imports this at module level)
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(typeof window !== "undefined" ? { storage: window.localStorage } : {}),
  },
});

// ── Profile helpers ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  approved: boolean;
  is_admin: boolean;
}

/** Read the current user's own profile (RLS: users can only read their own row). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at, approved, is_admin")
    .eq("id", userId)
    .single();

  // PGRST116 = no rows returned, not a real error
  if (error && error.code !== "PGRST116") {
    console.log("[supabase] getProfile error:", error.code, error.message);
  }
  return (data as Profile | null) ?? null;
}

/**
 * Create a pending profile if one doesn't exist yet.
 * Used as fallback when the DB trigger didn't fire (e.g. account pre-dates trigger).
 */
export async function ensureProfile(userId: string, email: string): Promise<Profile | null> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, email, approved: false, is_admin: false })
    .select("id, email, display_name, created_at, approved, is_admin")
    .single();

  if (error) {
    console.log("[supabase] ensureProfile insert error:", error.code, error.message);
    return null;
  }
  return data as Profile;
}

/** Admin: list every profile ordered by signup date. */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at, approved, is_admin")
    .order("created_at", { ascending: false });

  if (error) console.log("[supabase] getAllProfiles error:", error.code, error.message);
  return (data ?? []) as Profile[];
}

/** Admin: flip the approved flag on any profile. */
export async function setUserApproval(userId: string, approved: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ approved })
    .eq("id", userId);
  if (error) throw error;
}

// ── Conversation helpers ───────────────────────────────────

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  apiText?: string;
}

export async function loadConversations(
  userId: string
): Promise<Record<string, StoredMessage[]>> {
  const { data, error } = await supabase
    .from("conversations")
    .select("agent_id, messages")
    .eq("user_id", userId);

  if (error || !data) return {};

  return data.reduce<Record<string, StoredMessage[]>>((acc, row) => {
    acc[row.agent_id] = row.messages as StoredMessage[];
    return acc;
  }, {});
}

export async function saveConversation(
  userId: string,
  agentId: string,
  messages: StoredMessage[]
): Promise<void> {
  const cleaned = messages
    .filter((m) => !(m.role === "assistant" && m.content === ""))
    .map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.apiText ? { apiText: m.apiText } : {}),
    }));

  await supabase.from("conversations").upsert(
    { user_id: userId, agent_id: agentId, messages: cleaned },
    { onConflict: "user_id,agent_id" }
  );
}
