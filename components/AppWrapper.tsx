"use client";

import { useEffect, useState } from "react";
import LoginScreen from "./LoginScreen";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [booted, setBooted]                   = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("jarvis_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Tela preta enquanto verifica o localStorage — nunca mostra o app sem verificar
  if (isLoading) {
    return <div style={{ position: "fixed", inset: 0, background: "#000814" }} />;
  }

  // Não autenticado → APENAS LoginScreen, nada mais
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onSuccess={() => {
          localStorage.setItem("jarvis_auth", "true");
          setIsAuthenticated(true);
        }}
      />
    );
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
