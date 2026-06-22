import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Profile helpers ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  approved: boolean;
  is_admin: boolean;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at, approved, is_admin")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at, approved, is_admin")
    .order("created_at", { ascending: false });
  return (data ?? []) as Profile[];
}

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
  // Strip large base64 blobs before persisting
  const cleaned = messages
    .filter((m) => !(m.role === "assistant" && m.content === ""))
    .map((m) => ({ role: m.role, content: m.content, ...(m.apiText ? { apiText: m.apiText } : {}) }));

  await supabase.from("conversations").upsert(
    { user_id: userId, agent_id: agentId, messages: cleaned },
    { onConflict: "user_id,agent_id" }
  );
}
