import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentes de IA",
  description: "Plataforma de 3 agentes de IA: Imagens, Copys e Vídeos — powered by Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
