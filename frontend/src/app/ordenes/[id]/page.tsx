"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { OrdenDetalle, EstadoOrden, TipoItem } from "@/lib/types";
import { fecha, money, estadoLabel, hace } from "@/lib/format";
import { EstadoBadge } from "@/components/EstadoBadge";
import { useUsuario } from "@/components/UsuarioProvider";

const estados: EstadoOrden[] = ["Recibido", "EnTrabajo", "Entregado"];

interface ItemEdit {
  descripcion: string;
  tipo: TipoItem;
  cantidad: number;
  valorUnitario: number;
}

export default function DetalleOrden() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const esNueva = sp.get("nueva") === "1";
  const { usuario } = useUsuario();

  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemEdit[]>([]);
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsGuardados, setItemsGuardados] = useState(false);

  async function cargar() {
    try {
      const o = await api.detalle(Number(id));
      setOrden(o);
      setItems(o.items.map((i) => ({ descripcion: i.descripcion, tipo: i.tipo, cantidad: i.cantidad, valorUnitario: i.valorUnitario })));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
    // Refresco en tiempo real: estado, checklist y auditoría se actualizan
    // solos si el otro usuario cambia algo. No toca el editor de cotización
    // para no pisar lo que se esté escribiendo.
    const t = setInterval(async () => {
      try {
        setOrden(await api.detalle(Number(id)));
      } catch {
        /* ignora errores transitorios de red */
      }
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cambiarEstado(estado: EstadoOrden) {
    if (!orden) return;
    setOrden(await api.cambiarEstado(orden.id, estado, usuario));
  }

  async function toggleChecklist(itemId: number, completado: boolean) {
    if (!orden) return;
    // optimista: refleja el cambio al instante y luego confirma con el server
    setOrden({
      ...orden,
      checklist: orden.checklist.map((c) => (c.id === itemId ? { ...c, completado } : c)),
    });
    setOrden(await api.completarChecklist(orden.id, itemId, completado));
  }

  function addItem(tipo: TipoItem) {
    setItems((xs) => [...xs, { descripcion: "", tipo, cantidad: 1, valorUnitario: 0 }]);
    setItemsGuardados(false);
  }
  function updItem(i: number, patch: Partial<ItemEdit>) {
    setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
    setItemsGuardados(false);
  }
  function delItem(i: number) {
    setItems((xs) => xs.filter((_, idx) => idx !== i));
    setItemsGuardados(false);
  }

  async function guardarItems() {
    if (!orden) return;
    setGuardandoItems(true);
    try {
      const o = await api.guardarItems(orden.id, items.filter((i) => i.descripcion.trim()));
      setOrden(o);
      setItemsGuardados(true);
    } finally {
      setGuardandoItems(false);
    }
  }

  const totalRep = items.filter((i) => i.tipo === "Repuesto").reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
  const totalMo = items.filter((i) => i.tipo === "ManoObra").reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);

  if (error)
    return <div className="p-4 rounded-lg bg-brand/10 border border-brand/30">Error: {error}</div>;
  if (!orden) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-sm text-muted hover:text-foreground">← Volver al tablero</Link>

      {esNueva && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300">
          ✓ Entrada registrada. Descarga el comprobante de entrada abajo.
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between mt-4 mb-5 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black font-mono tracking-wide">{orden.vehiculo.placa}</h1>
            <EstadoBadge estado={orden.estado} />
          </div>
          <p className="text-muted mt-1">
            {orden.vehiculo.marca} {orden.vehiculo.modelo} · {orden.vehiculo.tipo} · {orden.numero}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={api.pdfEntradaUrl(orden.id)} target="_blank" rel="noopener"
            className="px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-sm font-medium">
            📄 PDF Entrada
          </a>
          <a href={api.pdfFacturaUrl(orden.id)} target="_blank" rel="noopener"
            className="px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold">
            🧾 PDF Cotización
          </a>
        </div>
      </div>

      {/* Cambio de estado */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted">Cambiar estado del vehículo</span>
          {orden.ultimoEstadoPor && orden.ultimoEstadoEn && (
            <span className="text-xs text-muted">
              Último cambio por <span className="text-brand font-semibold">{orden.ultimoEstadoPor}</span>{" "}
              · {hace(orden.ultimoEstadoEn)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {estados.map((e) => (
            <button
              key={e}
              onClick={() => cambiarEstado(e)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                orden.estado === e
                  ? "bg-brand border-brand text-white"
                  : "bg-surface-2 border-border text-muted hover:text-foreground"
              }`}
            >
              {estadoLabel[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card title="Cliente">
          <Dato k="Nombre" v={orden.cliente.nombre} />
          <Dato k="Teléfono" v={orden.cliente.telefono} />
          {orden.cliente.documento && <Dato k="Documento" v={orden.cliente.documento} />}
        </Card>
        <Card title="Ingreso">
          <Dato k="Fecha" v={fecha(orden.fechaIngreso)} />
          <Dato k="Kilometraje" v={`${orden.kilometraje.toLocaleString("es-CO")} km`} />
          {orden.nivelCombustible && <Dato k="Combustible" v={orden.nivelCombustible} />}
        </Card>
      </div>

      {/* Checklist + extras */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card title="Checklist de trabajos">
          {orden.checklist.length === 0 ? (
            <p className="text-muted text-sm">Sin ítems marcados.</p>
          ) : (
            (() => {
              const total = orden.checklist.length;
              const hechos = orden.checklist.filter((c) => c.completado).length;
              const pct = Math.round((hechos / total) * 100);
              return (
                <>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>Avance del trabajo</span>
                      <span className={hechos === total ? "text-emerald-400 font-semibold" : ""}>
                        {hechos}/{total}{hechos === total ? " ✓ Completo" : ""}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ul className="space-y-0.5">
                    {orden.checklist.map((c) => (
                      <li key={c.id}>
                        <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1.5 px-2 -mx-2 rounded-lg hover:bg-surface-2 transition-colors">
                          <input
                            type="checkbox"
                            checked={c.completado}
                            onChange={(e) => toggleChecklist(c.id, e.target.checked)}
                            className="accent-emerald-500 w-4 h-4 shrink-0"
                          />
                          <span className={c.completado ? "line-through text-muted" : ""}>{c.nombre}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()
          )}
        </Card>
        <Card title="Extras reportados">
          <p className="text-sm text-muted">{orden.descripcionExtras || "Sin observaciones."}</p>
        </Card>
      </div>

      {/* Cotización */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Cotización / Factura</h2>
          <div className="flex gap-2">
            <button onClick={() => addItem("Repuesto")} className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-border/40">
              + Repuesto
            </button>
            <button onClick={() => addItem("ManoObra")} className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-border/40">
              + Mano de obra
            </button>
          </div>
        </div>

        <Tabla titulo="Repuestos" tipo="Repuesto" items={items} updItem={updItem} delItem={delItem} total={totalRep} />
        <Tabla titulo="Mano de obra" tipo="ManoObra" items={items} updItem={updItem} delItem={delItem} total={totalMo} />

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted">
            {itemsGuardados && <span className="text-emerald-400">✓ Guardado</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted">Total</div>
              <div className="text-2xl font-black text-brand">{money(totalRep + totalMo)}</div>
            </div>
            <button
              onClick={guardarItems}
              disabled={guardandoItems}
              className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              {guardandoItems ? "Guardando…" : "Guardar cotización"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tabla({
  titulo, tipo, items, updItem, delItem, total,
}: {
  titulo: string;
  tipo: TipoItem;
  items: ItemEdit[];
  updItem: (i: number, patch: Partial<ItemEdit>) => void;
  delItem: (i: number) => void;
  total: number;
}) {
  // indices globales de los items de este tipo
  const idx = items.map((it, i) => ({ it, i })).filter((x) => x.it.tipo === tipo);

  return (
    <div className="mb-4">
      <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">{titulo}</div>
      {idx.length === 0 ? (
        <p className="text-sm text-muted/60 italic mb-1">Sin ítems.</p>
      ) : (
        <div className="space-y-2">
          {idx.map(({ it, i }) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                value={it.descripcion}
                onChange={(e) => updItem(i, { descripcion: e.target.value })}
                placeholder="Descripción"
                className="w-full sm:flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={it.cantidad}
                  min={0}
                  onChange={(e) => updItem(i, { cantidad: Number(e.target.value) })}
                  className="w-12 sm:w-16 bg-surface-2 border border-border rounded-lg px-2 py-2 text-sm text-center outline-none focus:border-brand shrink-0"
                />
                <input
                  type="number"
                  value={it.valorUnitario || ""}
                  min={0}
                  onChange={(e) => updItem(i, { valorUnitario: Number(e.target.value) })}
                  placeholder="Valor"
                  className="flex-1 min-w-0 sm:flex-none sm:w-28 bg-surface-2 border border-border rounded-lg px-2 py-2 text-sm text-right outline-none focus:border-brand"
                />
                <span className="w-20 sm:w-24 text-right text-sm font-semibold shrink-0">{money(it.cantidad * it.valorUnitario)}</span>
                <button onClick={() => delItem(i)} className="text-muted hover:text-brand px-1 shrink-0" aria-label="Eliminar">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-right text-sm mt-2">
        <span className="text-muted">Subtotal {titulo.toLowerCase()}: </span>
        <span className="font-semibold">{money(total)}</span>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
