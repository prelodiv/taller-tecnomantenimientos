"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CrearOrdenInput, TipoVehiculo } from "@/lib/types";

const nivelesCombustible = ["Vacío", "1/4", "1/2", "3/4", "Lleno"];

export default function NuevaEntrada() {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [form, setForm] = useState<CrearOrdenInput>({
    clienteNombre: "",
    clienteTelefono: "",
    clienteDocumento: "",
    placa: "",
    tipo: "Carro",
    marca: "",
    modelo: "",
    color: "",
    anio: undefined,
    kilometraje: 0,
    nivelCombustible: "1/2",
    descripcionExtras: "",
    observaciones: "",
    checklistMarcado: [],
  });

  useEffect(() => {
    api.catalogoChecklist().then(setCatalogo).catch(() => {});
  }, []);

  const set = <K extends keyof CrearOrdenInput>(k: K, v: CrearOrdenInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function toggle(nombre: string) {
    setChecklist((prev) => {
      const next = new Set(prev);
      next.has(nombre) ? next.delete(nombre) : next.add(nombre);
      return next;
    });
  }

  // Si la placa ya existe, precargar datos del vehículo y cliente
  async function buscarPlaca(placaArg?: string) {
    const placa = (placaArg ?? form.placa).trim();
    if (!placa) return;
    setAviso(null);
    try {
      const h = await api.historial(placa);
      setForm((f) => ({
        ...f,
        clienteNombre: h.cliente.nombre,
        clienteTelefono: h.cliente.telefono,
        clienteDocumento: h.cliente.documento ?? "",
        tipo: h.vehiculo.tipo,
        marca: h.vehiculo.marca,
        modelo: h.vehiculo.modelo,
        color: h.vehiculo.color ?? "",
        anio: h.vehiculo.anio ?? undefined,
      }));
      setAviso(
        `Vehículo conocido: ${h.cliente.nombre} — ${h.ordenes.length} visita(s) previa(s).`
      );
    } catch {
      setAviso("Placa nueva. Completa los datos del vehículo.");
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const orden = await api.crearOrden({
        ...form,
        checklistMarcado: [...checklist],
        anio: form.anio || undefined,
      });
      router.push(`/ordenes/${orden.id}?nueva=1`);
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-1">Registrar entrada de vehículo</h1>
      <p className="text-muted text-sm mb-6">
        Al guardar se genera la orden y el comprobante de entrada en PDF.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-brand/10 border border-brand/30 text-sm">{error}</div>
      )}

      {/* Vehículo */}
      <Section title="Vehículo">
        <div className="md:col-span-2 flex gap-2 items-end">
          <Field label="Placa" className="flex-1">
            <input
              required
              value={form.placa}
              onChange={(e) => set("placa", e.target.value.toUpperCase())}
              onBlur={(e) => buscarPlaca(e.target.value)}
              placeholder="ABC123"
              className={inputCls + " font-mono tracking-wider"}
            />
          </Field>
          <button
            type="button"
            onClick={() => buscarPlaca()}
            className="h-[42px] px-4 rounded-lg border border-border bg-surface-2 hover:bg-border/40 text-sm font-medium"
          >
            Buscar
          </button>
        </div>
        <Field label="Tipo">
          <select
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value as TipoVehiculo)}
            className={inputCls}
          >
            <option value="Carro">Carro</option>
            <option value="Moto">Moto</option>
          </select>
        </Field>
        <Field label="Marca">
          <input required value={form.marca} onChange={(e) => set("marca", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Modelo / Línea">
          <input required value={form.modelo} onChange={(e) => set("modelo", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Color">
          <input value={form.color ?? ""} onChange={(e) => set("color", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Año">
          <input
            type="number"
            value={form.anio ?? ""}
            onChange={(e) => set("anio", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls}
          />
        </Field>
        {aviso && (
          <div className="md:col-span-2 text-sm text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
            {aviso}
          </div>
        )}
      </Section>

      {/* Cliente */}
      <Section title="Cliente">
        <Field label="Nombre">
          <input required value={form.clienteNombre} onChange={(e) => set("clienteNombre", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Teléfono">
          <input required value={form.clienteTelefono} onChange={(e) => set("clienteTelefono", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Documento (opcional)">
          <input value={form.clienteDocumento ?? ""} onChange={(e) => set("clienteDocumento", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      {/* Ingreso */}
      <Section title="Datos de ingreso">
        <Field label="Kilometraje">
          <input
            type="number"
            required
            value={form.kilometraje || ""}
            onChange={(e) => set("kilometraje", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Nivel de combustible">
          <select value={form.nivelCombustible ?? ""} onChange={(e) => set("nivelCombustible", e.target.value)} className={inputCls}>
            {nivelesCombustible.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Checklist */}
      <Section title="Checklist — trabajos rutinarios">
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-2">
          {catalogo.map((item) => (
            <label
              key={item}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                checklist.has(item)
                  ? "bg-brand/15 border-brand/40"
                  : "bg-surface-2 border-border hover:border-muted"
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.has(item)}
                onChange={() => toggle(item)}
                className="accent-brand w-4 h-4"
              />
              {item}
            </label>
          ))}
        </div>
      </Section>

      {/* Extras */}
      <Section title="Extras / lo que reporta el cliente">
        <div className="md:col-span-2">
          <textarea
            value={form.descripcionExtras ?? ""}
            onChange={(e) => set("descripcionExtras", e.target.value)}
            rows={3}
            placeholder="Ej: el cliente dice que hay un sonido raro al arrancar…"
            className={inputCls + " resize-none"}
          />
        </div>
      </Section>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="submit"
          disabled={guardando}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {guardando ? "Guardando…" : "Registrar entrada y generar PDF"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5 mb-4">
      <h2 className="font-bold mb-4">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
