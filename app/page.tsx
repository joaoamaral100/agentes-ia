"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import LoginScreen from "@/components/LoginScreen";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, getAgent } from "@/lib/agents";

type ChatState = Record<AgentId, ChatMessage[]>;

const STORAGE_KEY = "jarvis_chats";

const emptyState: ChatState = AGENTS.reduce((acc, a) => {
  acc[a.id] = [];
  return acc;
}, {} as ChatState);

function loadChats(): ChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<Record<AgentId, ChatMessage[]>>;
    return AGENTS.reduce((acc, a) => {
      acc[a.id] = parsed[a.id] ?? [];
      return acc;
    }, {} as ChatState);
  } catch {
    return emptyState;
  }
}

function saveChats(chats: ChatState) {
  try {
    // Strip base64 images before saving — too large for localStorage (5 MB limit)
    const stripped = AGENTS.reduce((acc, a) => {
      acc[a.id] = chats[a.id]
        .filter((m) => !(m.role === "assistant" && m.content === "")) // skip empty streaming placeholder
        .map((m) => ({ role: m.role, content: m.content, ...(m.apiText ? { apiText: m.apiText } : {}) }));
      return acc;
    }, {} as ChatState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export default function Home() {
  // null = checking, false = not authenticated, true = authenticated
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats] = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guard: only save AFTER initial load — prevents overwriting stored data with emptyState
  const chatsLoadedRef = useRef(false);
  // Mirror of chats in a ref so updateMessages can save synchronously without stale closures
  const chatsRef = useRef<ChatState>(emptyState);

  useEffect(() => {
    const stored = localStorage.getItem("jarvis_auth");
    setAuthenticated(stored === "true");
    const loaded = loadChats();
    chatsRef.current = loaded;
    setChats(loaded);
    chatsLoadedRef.current = true;
  }, []);

  if (authenticated === null) {
    // Prevent flash — render nothing until localStorage is checked
    return null;
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  }

  const agent = getAgent(activeAgent)!;

  function updateMessages(id: AgentId, messages: ChatMessage[]) {
    const next = { ...chatsRef.current, [id]: messages };
    chatsRef.current = next;
    setChats(next);
    if (chatsLoadedRef.current && authenticated === true) {
      saveChats(next);
    }
  }

  function handleNewChat(id: AgentId) {
    updateMessages(id, []);
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeAgent={activeAgent}
        onSelect={(id) => { setActiveAgent(id); setSidebarOpen(false); }}
        onNewChat={(id) => { handleNewChat(id); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatView
        key={activeAgent}
        agent={agent}
        messages={chats[activeAgent]}
        onMessagesChange={(msgs) => updateMessages(activeAgent, msgs)}
        onMenuClick={() => setSidebarOpen(true)}
      />
    </main>
  );
}
