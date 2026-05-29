"use client";

import { useEffect, useState } from "react";
import VoiceAssistant from "./VoiceAssistant";

export default function VoiceAssistantWrapper() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(localStorage.getItem("jarvis_auth") === "true");

    // Re-check when auth changes (e.g. login/logout)
    const handler = () => setIsAuth(localStorage.getItem("jarvis_auth") === "true");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!isAuth) return null;
  return <VoiceAssistant />;
}
