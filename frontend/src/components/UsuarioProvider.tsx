"use client";

import { createContext, useContext, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Logo } from "./Logo";

interface Ctx {
  usuario: string;
  salir: () => Promise<void>;
}

const UsuarioContext = createContext<Ctx>({ usuario: "", salir: async () => {} });
export const useUsuario = () => useContext(UsuarioContext);

export function UsuarioProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.me().then((user) => { if (active) setUsuario(user.username); })
      .catch(() => {})
      .finally(() => { if (active) setChecking(false); });
    const expired = () => setUsuario(null);
    window.addEventListener("taller:unauthorized", expired);
    return () => { active = false; window.removeEventListener("taller:unauthorized", expired); };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await api.login(username, password);
      setPassword("");
      setUsuario(user.username);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally { setBusy(false); }
  }

  async function salir() {
    try {
      await api.logout();
      setUsuario(null);
      setError("");
    } catch { setError("No se pudo cerrar la sesión. Intenta de nuevo."); }
  }

  if (checking) return <p className="m-auto p-8 text-muted" role="status">Verificando sesión…</p>;

  if (!usuario) return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm bg-surface border border-border rounded-xl p-7 shadow-xl">
        <Logo />
        <h1 className="text-2xl font-black mt-8">Ingresar al taller</h1>
        <p className="text-muted text-sm mt-2 mb-6">Accede con tu usuario para gestionar vehículos y órdenes.</p>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold mb-1">Usuario</label>
            <input id="username" name="username" autoComplete="username" required maxLength={100}
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 outline-none focus:border-brand" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-1">Clave</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 outline-none focus:border-brand" />
          </div>
          {error && <p role="alert" className="text-sm text-brand">{error}</p>}
          <button disabled={busy} type="submit"
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg py-2.5 disabled:opacity-50">
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );

  return (
    <UsuarioContext.Provider value={{ usuario, salir }}>
      {error && <p role="alert" className="p-3 text-brand">{error}</p>}
      {children}
    </UsuarioContext.Provider>
  );
}
