"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null | undefined>(undefined); // undefined = carregando
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Lê sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Escuta mudanças de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Aguardando verificação — tela preta, nunca expõe o app
  if (user === undefined) {
    return <div style={{ position: "fixed", inset: 0, background: "#000814" }} />;
  }

  // Não autenticado → só LoginScreen
  if (!user) {
    return <LoginScreen onSuccess={() => { /* onAuthStateChange detecta automaticamente */ }} />;
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
