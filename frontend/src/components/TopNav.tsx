"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { useUsuario } from "./UsuarioProvider";

const links = [
  { href: "/", label: "Tablero" },
  { href: "/entrada", label: "Nueva entrada" },
  { href: "/historial", label: "Historial" },
];

export function TopNav() {
  const path = usePathname();
  const { usuario, salir } = useUsuario();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  const navLinks = (
    <>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive(l.href)
              ? "bg-brand text-white"
              : "text-muted hover:text-foreground hover:bg-surface-2"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );

  const userPicker = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 text-brand text-xs font-bold grid place-items-center">
        {usuario.slice(0, 2).toUpperCase()}
      </span>
      <span className="text-sm">{usuario}<span className="block text-xs text-muted">Administrador</span></span>
      <button type="button" onClick={salir} className="text-sm border border-border rounded-md px-2 py-1.5 hover:bg-surface-2">Salir</button>
    </div>
  );

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Fila principal: logo + (links en desktop) + selector de usuario */}
        <div className="h-16 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-1">{navLinks}</nav>
            {userPicker}
          </div>
        </div>
        {/* En móvil: links en una segunda fila desplazable */}
        <nav className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">{navLinks}</nav>
      </div>
    </header>
  );
}
