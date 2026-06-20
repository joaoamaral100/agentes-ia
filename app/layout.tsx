import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", weight: ["400","500","600"] });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["600","700","800"] });

export const metadata: Metadata = {
  title: "BEXT — Agentes de IA",
  description: "Plataforma de agentes de IA para TikTok Shopping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${display.variable} antialiased`}>
        {/* Scan line */}
        <div aria-hidden="true" className="scan-line" />

        {/* Ambient orbs */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* Boot sequence + HUD overlay + app */}
        <AppWrapper>
          <div className="relative h-full" style={{ zIndex: 1 }}>
            {children}
          </div>
        </AppWrapper>

      </body>
    </html>
  );
}
