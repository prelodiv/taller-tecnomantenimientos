export type EstadoOrden = "Recibido" | "EnTrabajo" | "Entregado";
export type TipoVehiculo = "Carro" | "Moto";
export type TipoItem = "Repuesto" | "ManoObra";

export interface OrdenResumen {
  id: number;
  numero: string;
  placa: string;
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modelo: string;
  clienteNombre: string;
  fechaIngreso: string;
  kilometraje: number;
  estado: EstadoOrden;
  descripcionExtras: string | null;
  checklistTotal: number;
  checklistCompletado: number;
  ultimoEstadoPor: string | null;
  ultimoEstadoEn: string | null;
}

export interface Vehiculo {
  id: number;
  placa: string;
  tipo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string | null;
  anio: number | null;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  documento: string | null;
  email: string | null;
}

export interface ChecklistItem {
  id: number;
  nombre: string;
  marcado: boolean;
  completado: boolean;
  nota: string | null;
}

export interface ItemFactura {
  id: number;
  descripcion: string;
  tipo: TipoItem;
  cantidad: number;
  valorUnitario: number;
  subtotal: number;
}

export interface OrdenDetalle {
  id: number;
  numero: string;
  estado: EstadoOrden;
  fechaIngreso: string;
  kilometraje: number;
  nivelCombustible: string | null;
  descripcionExtras: string | null;
  observaciones: string | null;
  ultimoEstadoPor: string | null;
  ultimoEstadoEn: string | null;
  vehiculo: Vehiculo;
  cliente: Cliente;
  checklist: ChecklistItem[];
  items: ItemFactura[];
  totalRepuestos: number;
  totalManoObra: number;
  total: number;
}

export interface Historial {
  vehiculo: Vehiculo;
  cliente: Cliente;
  ordenes: OrdenResumen[];
}

export interface CrearOrdenInput {
  clienteNombre: string;
  clienteTelefono: string;
  clienteDocumento?: string | null;
  placa: string;
  tipo: TipoVehiculo;
  marca: string;
  modelo: string;
  color?: string | null;
  anio?: number | null;
  kilometraje: number;
  nivelCombustible?: string | null;
  descripcionExtras?: string | null;
  observaciones?: string | null;
  checklistMarcado: string[];
}
