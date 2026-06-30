import type { EstadoOrden } from "@/lib/types";
import { estadoColor, estadoDot, estadoLabel } from "@/lib/format";

export function EstadoBadge({ estado }: { estado: EstadoOrden }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${estadoColor[estado]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${estadoDot[estado]}`} />
      {estadoLabel[estado]}
    </span>
  );
}
