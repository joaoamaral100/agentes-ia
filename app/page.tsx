"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import { ChatMessage } from "@/components/MessageBubble";
import { AGENTS, AgentId, getAgent } from "@/lib/agents";

type ChatState = Record<AgentId, ChatMessage[]>;

const emptyState: ChatState = AGENTS.reduce((acc, a) => {
  acc[a.id] = [];
  return acc;
}, {} as ChatState);

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("imagens");
  const [chats, setChats] = useState<ChatState>(emptyState);

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
        onSelect={setActiveAgent}
        onNewChat={handleNewChat}
      />
      <ChatView
        key={activeAgent}
        agent={agent}
        messages={chats[activeAgent]}
        onMessagesChange={(msgs) => updateMessages(activeAgent, msgs)}
      />
    </main>
  );
}
