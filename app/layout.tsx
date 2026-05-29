import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agentes de IA",
  description: "Plataforma de agentes de IA para TikTok Shopping — powered by Claude",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        {/* Ambient background orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* App content */}
        <div className="relative h-full" style={{ zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
