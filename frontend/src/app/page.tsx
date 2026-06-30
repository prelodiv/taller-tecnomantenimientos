"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OrdenResumen, EstadoOrden } from "@/lib/types";
import { fecha, estadoLabel, hace } from "@/lib/format";

const columnas: { estado: EstadoOrden; accent: string }[] = [
  { estado: "Recibido", accent: "border-t-blue-500" },
  { estado: "EnTrabajo", accent: "border-t-amber-500" },
  { estado: "Entregado", accent: "border-t-emerald-500" },
];

export default function Tablero() {
  const [ordenes, setOrdenes] = useState<OrdenResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    try {
      setOrdenes(await api.listarOrdenes());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 4000); // refresco "en tiempo real"
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black">Tablero de vehículos</h1>
          <p className="text-muted text-sm">Estado de las órdenes en tiempo real</p>
        </div>
        <Link
          href="/entrada"
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          + Nueva entrada
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-brand/10 border border-brand/30 text-sm">
          No se pudo conectar con el servidor ({error}). ¿Está corriendo el backend?
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {columnas.map(({ estado, accent }) => {
          const items = (ordenes ?? []).filter((o) => o.estado === estado);
          return (
            <div key={estado} className={`bg-surface rounded-xl border border-border border-t-4 ${accent}`}>
              <div className="px-4 py-3 flex items-center justify-between">
                <h2 className="font-bold">{estadoLabel[estado]}</h2>
                <span className="text-xs bg-surface-2 px-2 py-0.5 rounded-full text-muted">
                  {items.length}
                </span>
              </div>
              <div className="px-3 pb-3 space-y-2 min-h-[120px]">
                {ordenes === null ? (
                  <p className="text-muted text-sm px-1">Cargando…</p>
                ) : items.length === 0 ? (
                  <p className="text-muted text-sm px-1 py-4 text-center">Sin vehículos</p>
                ) : (
                  items.map((o) => <Tarjeta key={o.id} o={o} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tarjeta({ o }: { o: OrdenResumen }) {
  return (
    <Link
      href={`/ordenes/${o.id}`}
      className="block bg-surface-2 hover:bg-border/40 rounded-lg p-3 border border-border transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold tracking-wide">{o.placa}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted bg-background px-1.5 py-0.5 rounded">
          {o.tipoVehiculo}
        </span>
      </div>
      <div className="text-sm mt-1">
        {o.marca} {o.modelo}
      </div>
      <div className="text-xs text-muted mt-0.5">{o.clienteNombre}</div>
      {o.descripcionExtras && (
        <div className="text-xs text-muted mt-2 line-clamp-2 italic">“{o.descripcionExtras}”</div>
      )}
      {o.checklistTotal > 0 && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>Checklist</span>
            <span className={o.checklistCompletado === o.checklistTotal ? "text-emerald-400" : ""}>
              {o.checklistCompletado}/{o.checklistTotal}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(o.checklistCompletado / o.checklistTotal) * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="text-[11px] text-muted mt-2 flex items-center justify-between">
        <span>{o.numero}</span>
        <span>{fecha(o.fechaIngreso)}</span>
      </div>
      {o.ultimoEstadoPor && o.ultimoEstadoEn && (
        <div className="text-[10px] text-muted mt-1.5 pt-1.5 border-t border-border/60 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-brand/20 text-brand grid place-items-center font-bold text-[8px]">
            {o.ultimoEstadoPor.replace("Admin ", "A")}
          </span>
          movido por {o.ultimoEstadoPor} · {hace(o.ultimoEstadoEn)}
        </div>
      )}
    </Link>
  );
}
