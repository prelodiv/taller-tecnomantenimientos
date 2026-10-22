using Microsoft.EntityFrameworkCore;
using TallerApi.Models;

namespace TallerApi.Data;

public static class Seed
{
    public static async Task RunAsync(TallerDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        if (await db.Clientes.AnyAsync()) return; // ya sembrado

        // --- Cliente frecuente con historial ---
        var carlos = new Cliente { Nombre = "Carlos Ramírez", Telefono = "300 123 4567", Documento = "1.057.234.890" };
        var moto = new Vehiculo { Placa = "ABC12D", Tipo = TipoVehiculo.Moto, Marca = "Yamaha", Modelo = "FZ 2.0", Color = "Negro", Anio = 2021, Cliente = carlos };
        var carro = new Vehiculo { Placa = "KMR289", Tipo = TipoVehiculo.Carro, Marca = "Chevrolet", Modelo = "Spark GT", Color = "Rojo", Anio = 2018, Cliente = carlos };
        carlos.Vehiculos.Add(moto);
        carlos.Vehiculos.Add(carro);

        // Historial: revisión hace ~3 meses (entregada)
        var histo = new OrdenServicio
        {
            Numero = "OT-2026-0001",
            Vehiculo = carro,
            FechaIngreso = DateTime.UtcNow.AddMonths(-3),
            Kilometraje = 78400,
            Estado = EstadoOrden.Entregado,
            DescripcionExtras = "Cliente reporta chillido al frenar.",
            NivelCombustible = "1/2",
            UltimoEstadoPor = "Admin 1",
            UltimoEstadoEn = DateTime.UtcNow.AddMonths(-3).AddHours(6),
        };
        histo.Checklist.Add(new OrdenChecklist { Nombre = "Cambio de aceite", Marcado = true, Completado = true });
        histo.Checklist.Add(new OrdenChecklist { Nombre = "Cambio de pastillas de freno", Marcado = true, Completado = true });
        histo.Checklist.Add(new OrdenChecklist { Nombre = "Revisión de frenos", Marcado = true, Completado = true });
        histo.Items.Add(new ItemFactura { Descripcion = "Aceite 20W50 (galón)", Tipo = TipoItem.Repuesto, Cantidad = 1, ValorUnitario = 65000 });
        histo.Items.Add(new ItemFactura { Descripcion = "Pastillas de freno delanteras", Tipo = TipoItem.Repuesto, Cantidad = 1, ValorUnitario = 90000 });
        histo.Items.Add(new ItemFactura { Descripcion = "Mano de obra cambio de pastillas", Tipo = TipoItem.ManoObra, Cantidad = 1, ValorUnitario = 50000 });
        histo.Items.Add(new ItemFactura { Descripcion = "Mano de obra cambio de aceite", Tipo = TipoItem.ManoObra, Cantidad = 1, ValorUnitario = 25000 });

        // Orden actual en trabajo (moto)
        var actual = new OrdenServicio
        {
            Numero = "OT-2026-0002",
            Vehiculo = moto,
            FechaIngreso = DateTime.UtcNow.AddDays(-1),
            Kilometraje = 31200,
            Estado = EstadoOrden.EnTrabajo,
            DescripcionExtras = "Suena raro al arrancar, posible problema en la cadena.",
            NivelCombustible = "Lleno",
            UltimoEstadoPor = "Admin 2",
            UltimoEstadoEn = DateTime.UtcNow.AddHours(-3),
        };
        actual.Checklist.Add(new OrdenChecklist { Nombre = "Cambio de aceite", Marcado = true, Completado = true });
        actual.Checklist.Add(new OrdenChecklist { Nombre = "Revisión de correa / cadena", Marcado = true, Completado = false });

        // --- Otro cliente, orden recién recibida ---
        var laura = new Cliente { Nombre = "Laura Gómez", Telefono = "311 987 6543" };
        var camioneta = new Vehiculo { Placa = "GHT450", Tipo = TipoVehiculo.Carro, Marca = "Renault", Modelo = "Duster", Color = "Blanco", Anio = 2020, Cliente = laura };
        laura.Vehiculos.Add(camioneta);
        var recibida = new OrdenServicio
        {
            Numero = "OT-2026-0003",
            Vehiculo = camioneta,
            FechaIngreso = DateTime.UtcNow.AddHours(-2),
            Kilometraje = 54300,
            Estado = EstadoOrden.Recibido,
            NivelCombustible = "1/4",
            DescripcionExtras = "Revisión general de mantenimiento por kilometraje.",
        };
        recibida.Checklist.Add(new OrdenChecklist { Nombre = "Cambio de aceite", Marcado = true });
        recibida.Checklist.Add(new OrdenChecklist { Nombre = "Cambio de filtro de aceite", Marcado = true });
        recibida.Checklist.Add(new OrdenChecklist { Nombre = "Revisión de niveles (refrigerante/líquidos)", Marcado = true });

        db.AddRange(carlos, laura, histo, actual, recibida);
        await db.SaveChangesAsync();
    }
}
