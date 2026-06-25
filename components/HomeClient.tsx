"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import Footer from "@/components/Footer";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, getAgent } from "@/lib/agents";
import { supabase } from "@/lib/supabase";

type ChatState = Record<AgentId, ChatMessage[]>;

const CHATS_KEY = "jarvis_chats_v2";

function loadChats(): ChatState {
  const empty = AGENTS.reduce((acc, a) => { acc[a.id] = []; return acc; }, {} as ChatState);
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return empty;
    const stored = JSON.parse(raw) as Partial<ChatState>;
    return AGENTS.reduce((acc, a) => {
      acc[a.id] = (stored[a.id] ?? []) as ChatMessage[];
      return acc;
    }, {} as ChatState);
  } catch {
    return empty;
  }
}

function saveChats(chats: ChatState) {
  try {
    const stripped = AGENTS.reduce((acc, a) => {
      acc[a.id] = chats[a.id]
        .filter((m) => !(m.role === "assistant" && m.content === ""))
        .map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.apiText ? { apiText: m.apiText } : {}),
        })) as ChatMessage[];
      return acc;
    }, {} as ChatState);
    localStorage.setItem(CHATS_KEY, JSON.stringify(stripped));
  } catch {}
}

const emptyState: ChatState = AGENTS.reduce((acc, a) => { acc[a.id] = []; return acc; }, {} as ChatState);

export default function HomeClient() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats]             = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatsRef                      = useRef<ChatState>(emptyState);

  useEffect(() => {
    const stored = loadChats();
    chatsRef.current = stored;
    setChats(stored);
  }, []);

  function updateMessages(id: AgentId, messages: ChatMessage[]) {
    const next = { ...chatsRef.current, [id]: messages };
    chatsRef.current = next;
    setChats(next);
    saveChats(next);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    // onAuthStateChange no AppWrapper detecta e redireciona para LoginScreen
  }

  const agent = getAgent(activeAgent)!;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeAgent={activeAgent}
        onSelect={(id) => { setActiveAgent(id); setSidebarOpen(false); }}
        onNewChat={(id) => { updateMessages(id, []); setSidebarOpen(false); }}
        onSignOut={handleSignOut}
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
