"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import LoginScreen from "@/components/LoginScreen";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, getAgent } from "@/lib/agents";

type ChatState = Record<AgentId, ChatMessage[]>;

const emptyState: ChatState = AGENTS.reduce((acc, a) => {
  acc[a.id] = [];
  return acc;
}, {} as ChatState);

export default function Home() {
  // null = checking, false = not authenticated, true = authenticated
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats] = useState<ChatState>(emptyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("jarvis_auth");
    setAuthenticated(stored === "true");
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
    setChats((prev) => ({ ...prev, [id]: messages }));
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
