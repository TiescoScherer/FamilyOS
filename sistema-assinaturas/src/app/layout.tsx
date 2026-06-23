import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filara · Assinatura de Contratos",
  description: "Plataforma segura de assinatura eletrônica de contratos da Filara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
