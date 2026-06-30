namespace TallerApi.Models;

public enum TipoVehiculo { Carro, Moto }

public enum EstadoOrden { Recibido, EnTrabajo, Entregado }

public enum TipoItem { Repuesto, ManoObra }

public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string Telefono { get; set; } = "";
    public string? Documento { get; set; }
    public string? Email { get; set; }

    public List<Vehiculo> Vehiculos { get; set; } = new();
}

public class Vehiculo
{
    public int Id { get; set; }
    public string Placa { get; set; } = "";
    public TipoVehiculo Tipo { get; set; }
    public string Marca { get; set; } = "";
    public string Modelo { get; set; } = "";
    public string? Color { get; set; }
    public int? Anio { get; set; }

    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public List<OrdenServicio> Ordenes { get; set; } = new();
}

public class OrdenServicio
{
    public int Id { get; set; }
    public string Numero { get; set; } = "";          // consecutivo legible, ej OT-2026-0001
    public DateTime FechaIngreso { get; set; } = DateTime.Now;
    public int Kilometraje { get; set; }
    public EstadoOrden Estado { get; set; } = EstadoOrden.Recibido;
    public string? DescripcionExtras { get; set; }     // "suena raro al arrancar"
    public string? NivelCombustible { get; set; }      // ej "1/2", "Lleno"
    public string? Observaciones { get; set; }

    // Auditoría: quién movió el estado por última vez
    public string? UltimoEstadoPor { get; set; }
    public DateTime? UltimoEstadoEn { get; set; }

    public int VehiculoId { get; set; }
    public Vehiculo? Vehiculo { get; set; }

    public List<OrdenChecklist> Checklist { get; set; } = new();
    public List<ItemFactura> Items { get; set; } = new();
}

// Items rutinarios marcados en la orden (cambio de aceite, frenos, etc.)
public class OrdenChecklist
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public bool Marcado { get; set; }       // se incluyó en esta orden
    public bool Completado { get; set; }     // el mecánico ya lo terminó
    public string? Nota { get; set; }

    public int OrdenServicioId { get; set; }
    public OrdenServicio? OrdenServicio { get; set; }
}

// Lineas de cotizacion/factura, separadas por Repuesto / ManoObra
public class ItemFactura
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = "";
    public TipoItem Tipo { get; set; }
    public decimal Cantidad { get; set; } = 1;
    public decimal ValorUnitario { get; set; }
    public decimal Subtotal => Cantidad * ValorUnitario;

    public int OrdenServicioId { get; set; }
    public OrdenServicio? OrdenServicio { get; set; }
}
