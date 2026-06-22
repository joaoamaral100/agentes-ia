"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import LoginScreen from "@/components/LoginScreen";
import Footer from "@/components/Footer";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, getAgent } from "@/lib/agents";
import { supabase, loadConversations, saveConversation, StoredMessage } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type ChatState = Record<AgentId, ChatMessage[]>;

const emptyState: ChatState = AGENTS.reduce((acc, a) => {
  acc[a.id] = [];
  return acc;
}, {} as ChatState);

export default function HomeClient() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats] = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatsRef = useRef<ChatState>(emptyState);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      userRef.current = u;
      setUser(u);
      if (u) fetchConversations(u.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      userRef.current = u;
      setUser(u);
      if (u) fetchConversations(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchConversations(userId: string) {
    const stored = await loadConversations(userId);
    const merged = AGENTS.reduce((acc, a) => {
      acc[a.id] = (stored[a.id] ?? []) as ChatMessage[];
      return acc;
    }, {} as ChatState);
    chatsRef.current = merged;
    setChats(merged);
  }

  function updateMessages(id: AgentId, messages: ChatMessage[]) {
    const next = { ...chatsRef.current, [id]: messages };
    chatsRef.current = next;
    setChats(next);

    const uid = userRef.current?.id;
    if (uid) {
      const cleaned = messages
        .filter((m) => !(m.role === "assistant" && m.content === ""))
        .map((m) => ({ role: m.role, content: m.content, ...(m.apiText ? { apiText: m.apiText } : {}) }));
      saveConversation(uid, id, cleaned as StoredMessage[]);
    }
  }

  function handleNewChat(id: AgentId) {
    updateMessages(id, []);
  }

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return <LoginScreen onSuccess={() => { /* onAuthStateChange fires automatically */ }} />;
  }

  const agent = getAgent(activeAgent)!;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeAgent={activeAgent}
        onSelect={(id) => { setActiveAgent(id); setSidebarOpen(false); }}
        onNewChat={(id) => { handleNewChat(id); setSidebarOpen(false); }}
        onSignOut={() => supabase.auth.signOut()}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatView
          key={activeAgent}
          agent={agent}
          messages={chats[activeAgent]}
          onMessagesChange={(msgs) => updateMessages(activeAgent, msgs)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <Footer />
      </div>
    </main>
  );
}
