# Tecno Mantenimientos — Demo Taller

Sistema de ingreso, seguimiento y facturación de vehículos (carros y motos).

- **Backend:** .NET 10 Web API + EF Core (SQLite) + QuestPDF
- **Frontend:** Next.js 16 (App Router) + Tailwind 4
- **Colores de marca:** negro / rojo / blanco

## Funcionalidades
- **Tablero en tiempo real** por estado: Recibido → En trabajo → Entregado.
- **Registrar entrada**: placa, kilometraje, checklist rutinario + extras del cliente.
  - Si la placa ya existe, **autocompleta** vehículo y cliente.
- **Historial por placa**: visitas anteriores y qué se le hizo.
- **Cotización/Factura** separando **repuestos** y **mano de obra**.
- **2 PDFs con logo**: comprobante de **entrada** y **cotización/factura**.

## Cómo correrlo (local)

### 1) Backend  (puerto 5142)
```bash
cd backend
dotnet run --launch-profile http
```
La base de datos SQLite (`taller.db`) se crea y se siembra sola la primera vez.
Para reiniciar los datos de demo: borra `taller.db` y vuelve a correr.

### 2) Frontend  (puerto 3000)
```bash
cd frontend
npm run dev
```
Abre http://localhost:3000

La URL del backend se configura en `frontend/.env.local`
(`NEXT_PUBLIC_API_BASE`).

## Datos de demo
- **KMR289** — Chevrolet Spark GT (cliente frecuente, con revisión de hace 3 meses).
- **ABC12D** — Yamaha FZ 2.0 (en trabajo).
- **GHT450** — Renault Duster (recién recibida).
