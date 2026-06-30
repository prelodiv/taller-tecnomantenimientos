import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { UsuarioProvider } from "@/components/UsuarioProvider";

export const metadata: Metadata = {
  title: "Tecno Mantenimientos — Taller",
  description: "Sistema de ingreso, seguimiento y facturación de vehículos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <UsuarioProvider>
          <TopNav />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
        </UsuarioProvider>
      </body>
    </html>
  );
}
