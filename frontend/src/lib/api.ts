import type {
  OrdenResumen,
  OrdenDetalle,
  Historial,
  CrearOrdenInput,
  EstadoOrden,
  ItemFactura,
} from "./types";

export const API_BASE = "";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Taller-Request": "1", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401 && path !== "/api/auth/login" && typeof window !== "undefined")
      window.dispatchEvent(new Event("taller:unauthorized"));
    if (res.status === 429) throw new Error("Demasiados intentos. Espera un minuto e intenta otra vez.");
    const text = await res.text().catch(() => "");
    let message = text;
    try { message = JSON.parse(text).message ?? text; } catch {}
    throw new Error(message || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) => http<{ username: string; role: string }>("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username, password }),
  }),
  me: () => http<{ username: string; role: string }>("/api/auth/me"),
  logout: () => http<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
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
