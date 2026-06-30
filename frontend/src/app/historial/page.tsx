"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Historial } from "@/lib/types";
import { fecha } from "@/lib/format";
import { EstadoBadge } from "@/components/EstadoBadge";

export default function HistorialPage() {
  const [placa, setPlaca] = useState("");
  const [data, setData] = useState<Historial | null>(null);
  const [estado, setEstado] = useState<"idle" | "buscando" | "vacio">("idle");

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!placa.trim()) return;
    setEstado("buscando");
    setData(null);
    try {
      setData(await api.historial(placa));
      setEstado("idle");
    } catch {
      setEstado("vacio");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-1">Historial del vehículo</h1>
      <p className="text-muted text-sm mb-5">Busca por placa para ver visitas anteriores.</p>

      <form onSubmit={buscar} className="flex gap-2 mb-6">
        <input
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="Placa, ej: KMR289"
          className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-3 font-mono tracking-wider outline-none focus:border-brand"
        />
        <button className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 rounded-lg">Buscar</button>
      </form>

      {estado === "buscando" && <p className="text-muted">Buscando…</p>}
      {estado === "vacio" && (
        <div className="p-4 rounded-lg bg-surface border border-border text-muted text-sm">
          No hay registros para esa placa. Si es la primera vez, regístralo en{" "}
          <Link href="/entrada" className="text-brand">Nueva entrada</Link>.
        </div>
      )}

      {data && (
        <div>
          <div className="bg-surface border border-border rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-2xl font-black font-mono">{data.vehiculo.placa}</div>
                <div className="text-muted">
                  {data.vehiculo.marca} {data.vehiculo.modelo} · {data.vehiculo.tipo}
                  {data.vehiculo.anio ? ` · ${data.vehiculo.anio}` : ""}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">{data.cliente.nombre}</div>
                <div className="text-muted">{data.cliente.telefono}</div>
              </div>
            </div>
          </div>

          <h2 className="font-bold mb-3">{data.ordenes.length} visita(s)</h2>
          <div className="space-y-2">
            {data.ordenes.map((o) => (
              <Link
                key={o.id}
                href={`/ordenes/${o.id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:border-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{o.numero}</span>
                  <EstadoBadge estado={o.estado} />
                </div>
                <div className="text-sm text-muted mt-1 flex items-center justify-between">
                  <span>{fecha(o.fechaIngreso)}</span>
                  <span>{o.kilometraje.toLocaleString("es-CO")} km</span>
                </div>
                {o.descripcionExtras && (
                  <div className="text-sm mt-2 italic text-muted">“{o.descripcionExtras}”</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
