import type {
  OrdenResumen,
  OrdenDetalle,
  Historial,
  CrearOrdenInput,
  EstadoOrden,
  ItemFactura,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5142";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listarOrdenes: (estado?: EstadoOrden) =>
    http<OrdenResumen[]>(`/api/ordenes${estado ? `?estado=${estado}` : ""}`),

  detalle: (id: number) => http<OrdenDetalle>(`/api/ordenes/${id}`),

  crearOrden: (input: CrearOrdenInput) =>
    http<OrdenDetalle>(`/api/ordenes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  cambiarEstado: (id: number, estado: EstadoOrden, usuario: string) =>
    http<OrdenDetalle>(`/api/ordenes/${id}/estado`, {
      method: "PUT",
      body: JSON.stringify({ estado, usuario }),
    }),

  completarChecklist: (id: number, itemId: number, completado: boolean) =>
    http<OrdenDetalle>(`/api/ordenes/${id}/checklist/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ completado }),
    }),

  guardarItems: (
    id: number,
    items: Pick<ItemFactura, "descripcion" | "tipo" | "cantidad" | "valorUnitario">[]
  ) =>
    http<OrdenDetalle>(`/api/ordenes/${id}/items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  historial: (placa: string) =>
    http<Historial>(`/api/vehiculos/historial?placa=${encodeURIComponent(placa)}`),

  catalogoChecklist: () => http<string[]>(`/api/catalogo/checklist`),

  pdfEntradaUrl: (id: number) => `${API_BASE}/api/ordenes/${id}/pdf/entrada`,
  pdfFacturaUrl: (id: number) => `${API_BASE}/api/ordenes/${id}/pdf/factura`,
};
