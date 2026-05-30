import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "BEXT — Agentes de IA",
  description: "Plataforma de agentes de IA para TikTok Shopping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        {/* Scan line */}
        <div aria-hidden="true" className="scan-line" />

        {/* Ambient orbs */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* App */}
        <div className="relative h-full" style={{ zIndex: 1 }}>
          {children}
        </div>

      </body>
    </html>
  );
}
