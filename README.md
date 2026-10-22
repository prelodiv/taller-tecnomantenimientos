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
- Se cargan automáticamente solo en desarrollo. Para habilitarlos explícitamente:
  `Database__SeedDemo=true`. En producción usar `false`.
- **KMR289** — Chevrolet Spark GT (cliente frecuente, con revisión de hace 3 meses).
- **ABC12D** — Yamaha FZ 2.0 (en trabajo).
- **GHT450** — Renault Duster (recién recibida).

## MVP con datos persistentes: Vercel + Render + Neon

El frontend existente en Vercel sigue usando `NEXT_PUBLIC_API_BASE` con la URL
del backend de Render. No colocar contraseñas de base de datos en Vercel ni en
variables `NEXT_PUBLIC_*`.

Crear un proyecto Free en Neon y copiar la conexión del formato **.NET**
(solo el contenido de la cadena, sin comillas). En Render > taller-api >
Environment configurar:

| Variable | Valor |
| --- | --- |
| `Database__Provider` | `Postgres` |
| `ConnectionStrings__Postgres` | `Host=...;Database=neondb;Username=...;Password=...;SSL Mode=VerifyFull;Channel Binding=Require;` |
| `Database__SeedDemo` | `false` |

Guardar y desplegar la versión que soporta PostgreSQL. Las tablas se crean
automáticamente en una base vacía. Los registros se guardan en Neon y sobreviven
a los reinicios y nuevos despliegues de Render. `/health` indica que el proceso
está disponible; no ejecuta consultas periódicas que mantengan Neon despierto.

SQLite sigue disponible para desarrollo local con `Database__Provider=Sqlite`.
Un proveedor desconocido o una conexión PostgreSQL ausente producen un error de
arranque; no se usa SQLite silenciosamente cuando se ha seleccionado Postgres.

### Datos existentes y próximos cambios

El cambio de proveedor no copia el archivo SQLite anterior. Antes de desplegar,
respaldar y migrar cualquier registro real. Una base nueva con `SeedDemo=false`
empieza vacía. Las fechas nuevas se guardan en UTC y la interfaz las presenta
en la zona horaria del navegador.

La creación inicial usa `EnsureCreated`; no actualiza esquemas existentes.
Antes de introducir cambios de modelo, incorporar migraciones EF y respaldar
la base con `pg_dump` o las herramientas de Neon.

El plan gratuito de Render puede dormir por inactividad; la primera visita
puede tardar en responder. La persistencia de Neon no evita esa espera.

## Acceso de administrador

La interfaz exige usuario y clave. Las órdenes, historial, checklist, cotizaciones
y PDFs requieren una sesión con rol `Admin`; no existe registro público de usuarios.
El rol Admin permite todas las operaciones actuales del taller.

Para aprovisionar un administrador por primera vez, configurar temporalmente
`Admin__Username` y `Admin__Password` en las variables privadas de Render y
desplegar. La clave se guarda como hash PBKDF2 de ASP.NET Core Identity en Neon.
Después de verificar el acceso, quitar `Admin__Password` de Render; no hace falta
para los siguientes arranques. Si el usuario ya existe, el arranque no modifica
su clave ni su rol. No guardar claves en Git ni en variables `NEXT_PUBLIC_*`.

El navegador usa `/api` en el mismo dominio de Vercel; Next.js lo reenvía al
backend configurado en `API_PROXY_TARGET` (o el anterior `NEXT_PUBLIC_API_BASE`).
Las cookies de sesión son HttpOnly, SameSite=Lax y Secure en producción. Las
peticiones de escritura requieren `X-Taller-Request: 1`. El login limita intentos.
El usuario de auditoría se obtiene de la sesión y no del valor enviado por el cliente.

Las sesiones duran hasta ocho horas con renovación mientras se usan. Un reinicio
de Render puede invalidarlas porque las claves de protección de cookies están en
su disco temporal: basta volver a entrar; los usuarios y las órdenes permanecen
en Neon. Para varias instancias habrá que persistir esas claves y compartirlas.
La tabla `Usuarios` se agrega de forma idempotente a las bases anteriores del MVP.

Para recoger feedback, compartir el enlace con quienes prueban el flujo y registrar
los problemas sin datos personales en los issues del repositorio.
