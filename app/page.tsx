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

  // Refs to avoid stale closures in async streaming callbacks
  const chatsLoadedRef = useRef(false);
  const chatsRef = useRef<ChatState>(emptyState);
  const authRef = useRef(false);

  // Load on mount
  useEffect(() => {
    const stored = localStorage.getItem("jarvis_auth");
    const isAuth = stored === "true";
    authRef.current = isAuth;
    setAuthenticated(isAuth);
    const loaded = loadChats();
    chatsRef.current = loaded;
    setChats(loaded);
    chatsLoadedRef.current = true;
  }, []);

  // Belt-and-suspenders: save whenever chats state changes
  useEffect(() => {
    if (chatsLoadedRef.current && authRef.current) {
      saveChats(chats);
    }
  }, [chats]);

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
    // Save directly (no stale closure — uses refs, not captured state values)
    if (chatsLoadedRef.current && authRef.current) {
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
        onSelect={(id) => {
          // Flush save before switching so in-progress streaming is persisted
          if (chatsLoadedRef.current && authRef.current) saveChats(chatsRef.current);
          setActiveAgent(id);
          setSidebarOpen(false);
        }}
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
