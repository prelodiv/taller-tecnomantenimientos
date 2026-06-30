namespace TallerApi.Models;

// ---------- Requests ----------

public record CrearOrdenRequest(
    // Cliente
    string ClienteNombre,
    string ClienteTelefono,
    string? ClienteDocumento,
    // Vehiculo
    string Placa,
    TipoVehiculo Tipo,
    string Marca,
    string Modelo,
    string? Color,
    int? Anio,
    // Orden
    int Kilometraje,
    string? NivelCombustible,
    string? DescripcionExtras,
    string? Observaciones,
    List<string> ChecklistMarcado
);

public record CambiarEstadoRequest(EstadoOrden Estado, string? Usuario);

public record CompletarChecklistRequest(bool Completado);

public record ItemRequest(string Descripcion, TipoItem Tipo, decimal Cantidad, decimal ValorUnitario);

public record GuardarItemsRequest(List<ItemRequest> Items);

// ---------- Responses ----------

public record OrdenResumenDto(
    int Id,
    string Numero,
    string Placa,
    string TipoVehiculo,
    string Marca,
    string Modelo,
    string ClienteNombre,
    DateTime FechaIngreso,
    int Kilometraje,
    string Estado,
    string? DescripcionExtras,
    int ChecklistTotal,
    int ChecklistCompletado,
    string? UltimoEstadoPor,
    DateTime? UltimoEstadoEn
);

public record ChecklistDto(int Id, string Nombre, bool Marcado, bool Completado, string? Nota);

public record ItemDto(int Id, string Descripcion, string Tipo, decimal Cantidad, decimal ValorUnitario, decimal Subtotal);

public record OrdenDetalleDto(
    int Id,
    string Numero,
    string Estado,
    DateTime FechaIngreso,
    int Kilometraje,
    string? NivelCombustible,
    string? DescripcionExtras,
    string? Observaciones,
    string? UltimoEstadoPor,
    DateTime? UltimoEstadoEn,
    VehiculoDto Vehiculo,
    ClienteDto Cliente,
    List<ChecklistDto> Checklist,
    List<ItemDto> Items,
    decimal TotalRepuestos,
    decimal TotalManoObra,
    decimal Total
);

public record VehiculoDto(int Id, string Placa, string Tipo, string Marca, string Modelo, string? Color, int? Anio);

public record ClienteDto(int Id, string Nombre, string Telefono, string? Documento, string? Email);

public record HistorialDto(
    VehiculoDto Vehiculo,
    ClienteDto Cliente,
    List<OrdenResumenDto> Ordenes
);
