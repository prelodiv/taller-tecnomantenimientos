import type { EstadoOrden } from "./types";

export const money = (v: number) =>
  "$ " + Math.round(v).toLocaleString("es-CO");

export const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const hace = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} día${d > 1 ? "s" : ""}`;
  const mes = Math.floor(d / 30);
  return `hace ${mes} mes${mes > 1 ? "es" : ""}`;
};

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const estadoLabel: Record<EstadoOrden, string> = {
  Recibido: "Recibido",
  EnTrabajo: "En trabajo",
  Entregado: "Entregado",
};

export const estadoColor: Record<EstadoOrden, string> = {
  Recibido: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  EnTrabajo: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Entregado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export const estadoDot: Record<EstadoOrden, string> = {
  Recibido: "bg-blue-400",
  EnTrabajo: "bg-amber-400",
  Entregado: "bg-emerald-400",
};
