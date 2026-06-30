"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const USUARIOS = ["Admin 1", "Admin 2"];

interface Ctx {
  usuario: string;
  setUsuario: (u: string) => void;
}

const UsuarioContext = createContext<Ctx>({ usuario: USUARIOS[0], setUsuario: () => {} });
export const useUsuario = () => useContext(UsuarioContext);

export function UsuarioProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuarioState] = useState(USUARIOS[0]);

  useEffect(() => {
    const saved = localStorage.getItem("usuario");
    if (saved && USUARIOS.includes(saved)) setUsuarioState(saved);
  }, []);

  const setUsuario = (u: string) => {
    setUsuarioState(u);
    localStorage.setItem("usuario", u);
  };

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario }}>{children}</UsuarioContext.Provider>
  );
}
