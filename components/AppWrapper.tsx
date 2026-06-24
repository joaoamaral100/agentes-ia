"use client";

import { useState, useEffect } from "react";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";
import LoginScreen from "./LoginScreen";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    setAuthed(localStorage.getItem("jarvis_auth") === "true");
  }, []);

  // Aguardando verificação do localStorage
  if (authed === null) return null;

  // Não autenticado → tela de login
  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  // Autenticado → boot sequence + app
  return (
    <>
      <HudOverlay />
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      <div style={{ opacity: booted ? 1 : 0, height: "100%", transition: "opacity 0.45s ease" }}>
        {children}
      </div>
    </>
  );
}
