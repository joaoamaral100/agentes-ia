"use client";

import { useState } from "react";
import BootScreen from "./BootScreen";
import HudOverlay from "./HudOverlay";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);

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
