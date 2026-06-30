namespace TallerApi.Models;

public static class Mappers
{
    public static VehiculoDto ToDto(this Vehiculo v) =>
        new(v.Id, v.Placa, v.Tipo.ToString(), v.Marca, v.Modelo, v.Color, v.Anio);

    public static ClienteDto ToDto(this Cliente c) =>
        new(c.Id, c.Nombre, c.Telefono, c.Documento, c.Email);

    public static OrdenResumenDto ToResumen(this OrdenServicio o) =>
        new(o.Id, o.Numero, o.Vehiculo!.Placa, o.Vehiculo.Tipo.ToString(), o.Vehiculo.Marca,
            o.Vehiculo.Modelo, o.Vehiculo.Cliente!.Nombre, o.FechaIngreso, o.Kilometraje,
            o.Estado.ToString(), o.DescripcionExtras,
            o.Checklist.Count, o.Checklist.Count(c => c.Completado),
            o.UltimoEstadoPor, o.UltimoEstadoEn);

    public static OrdenDetalleDto ToDetalle(this OrdenServicio o)
    {
        var totalRep = o.Items.Where(i => i.Tipo == TipoItem.Repuesto).Sum(i => i.Subtotal);
        var totalMo = o.Items.Where(i => i.Tipo == TipoItem.ManoObra).Sum(i => i.Subtotal);
        return new OrdenDetalleDto(
            o.Id, o.Numero, o.Estado.ToString(), o.FechaIngreso, o.Kilometraje,
            o.NivelCombustible, o.DescripcionExtras, o.Observaciones,
            o.UltimoEstadoPor, o.UltimoEstadoEn,
            o.Vehiculo!.ToDto(), o.Vehiculo.Cliente!.ToDto(),
            o.Checklist.Select(c => new ChecklistDto(c.Id, c.Nombre, c.Marcado, c.Completado, c.Nota)).ToList(),
            o.Items.Select(i => new ItemDto(i.Id, i.Descripcion, i.Tipo.ToString(), i.Cantidad, i.ValorUnitario, i.Subtotal)).ToList(),
            totalRep, totalMo, totalRep + totalMo
        );
    }
}
