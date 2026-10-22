using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TallerApi.Data;
using TallerApi.Models;
using TallerApi.Services;

namespace TallerApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdenesController : ControllerBase
{
    private readonly TallerDbContext _db;
    private readonly PdfService _pdf;

    public OrdenesController(TallerDbContext db, PdfService pdf)
    {
        _db = db;
        _pdf = pdf;
    }

    // Tablero / lista de ordenes (con filtro opcional por estado)
    [HttpGet]
    public async Task<ActionResult<List<OrdenResumenDto>>> Listar([FromQuery] string? estado)
    {
        var q = _db.Ordenes
            .Include(o => o.Vehiculo).ThenInclude(v => v!.Cliente)
            .Include(o => o.Checklist)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(estado) && Enum.TryParse<EstadoOrden>(estado, true, out var e))
            q = q.Where(o => o.Estado == e);

        var ordenes = await q.OrderByDescending(o => o.FechaIngreso).ToListAsync();
        return ordenes.Select(o => o.ToResumen()).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrdenDetalleDto>> Detalle(int id)
    {
        var o = await CargarCompleta(id);
        return o is null ? NotFound() : o.ToDetalle();
    }

    // Registrar entrada de vehiculo: crea/reusa cliente + vehiculo y abre la orden.
    [HttpPost]
    public async Task<ActionResult<OrdenDetalleDto>> Crear(CrearOrdenRequest req)
    {
        var placa = req.Placa.Trim().ToUpperInvariant();

        var vehiculo = await _db.Vehiculos
            .Include(v => v.Cliente)
            .FirstOrDefaultAsync(v => v.Placa == placa);

        if (vehiculo is null)
        {
            // Reusar cliente por documento si viene, si no crear uno nuevo
            Cliente? cliente = null;
            if (!string.IsNullOrWhiteSpace(req.ClienteDocumento))
                cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Documento == req.ClienteDocumento);

            cliente ??= new Cliente
            {
                Nombre = req.ClienteNombre,
                Telefono = req.ClienteTelefono,
                Documento = req.ClienteDocumento,
            };

            vehiculo = new Vehiculo
            {
                Placa = placa,
                Tipo = req.Tipo,
                Marca = req.Marca,
                Modelo = req.Modelo,
                Color = req.Color,
                Anio = req.Anio,
                Cliente = cliente,
            };
            _db.Vehiculos.Add(vehiculo);
        }
        else
        {
            // actualizar datos de contacto por si cambiaron
            vehiculo.Cliente!.Nombre = req.ClienteNombre;
            vehiculo.Cliente.Telefono = req.ClienteTelefono;
        }

        var orden = new OrdenServicio
        {
            Numero = await SiguienteNumero(),
            Vehiculo = vehiculo,
            Kilometraje = req.Kilometraje,
            NivelCombustible = req.NivelCombustible,
            DescripcionExtras = req.DescripcionExtras,
            Observaciones = req.Observaciones,
            Estado = EstadoOrden.Recibido,
        };
        foreach (var nombre in req.ChecklistMarcado.Distinct())
            orden.Checklist.Add(new OrdenChecklist { Nombre = nombre, Marcado = true });

        _db.Ordenes.Add(orden);
        await _db.SaveChangesAsync();

        var creada = await CargarCompleta(orden.Id);
        return CreatedAtAction(nameof(Detalle), new { id = orden.Id }, creada!.ToDetalle());
    }

    [HttpPut("{id:int}/estado")]
    public async Task<ActionResult<OrdenDetalleDto>> CambiarEstado(int id, CambiarEstadoRequest req)
    {
        var o = await CargarCompleta(id);
        if (o is null) return NotFound();
        o.Estado = req.Estado;
        o.UltimoEstadoPor = string.IsNullOrWhiteSpace(req.Usuario) ? "Sistema" : req.Usuario;
        o.UltimoEstadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return o.ToDetalle();
    }

    // Marcar/desmarcar un item del checklist como completado (el mecanico)
    [HttpPut("{id:int}/checklist/{itemId:int}")]
    public async Task<ActionResult<OrdenDetalleDto>> CompletarChecklist(int id, int itemId, CompletarChecklistRequest req)
    {
        var o = await CargarCompleta(id);
        if (o is null) return NotFound();

        var item = o.Checklist.FirstOrDefault(c => c.Id == itemId);
        if (item is null) return NotFound();

        item.Completado = req.Completado;
        await _db.SaveChangesAsync();
        return o.ToDetalle();
    }

    // Guardar/reemplazar los items de la cotizacion/factura
    [HttpPut("{id:int}/items")]
    public async Task<ActionResult<OrdenDetalleDto>> GuardarItems(int id, GuardarItemsRequest req)
    {
        var o = await CargarCompleta(id);
        if (o is null) return NotFound();

        _db.Items.RemoveRange(o.Items);
        o.Items.Clear();
        foreach (var it in req.Items)
            o.Items.Add(new ItemFactura
            {
                Descripcion = it.Descripcion,
                Tipo = it.Tipo,
                Cantidad = it.Cantidad,
                ValorUnitario = it.ValorUnitario,
            });

        await _db.SaveChangesAsync();
        return o.ToDetalle();
    }

    // PDF de comprobante de entrada
    [HttpGet("{id:int}/pdf/entrada")]
    public async Task<IActionResult> PdfEntrada(int id)
    {
        var o = await CargarCompleta(id);
        if (o is null) return NotFound();
        var bytes = _pdf.GenerarEntrada(o);
        return File(bytes, "application/pdf", $"Entrada-{o.Numero}.pdf");
    }

    // PDF de cotizacion/factura (repuestos + mano de obra)
    [HttpGet("{id:int}/pdf/factura")]
    public async Task<IActionResult> PdfFactura(int id)
    {
        var o = await CargarCompleta(id);
        if (o is null) return NotFound();
        var bytes = _pdf.GenerarFactura(o);
        return File(bytes, "application/pdf", $"Factura-{o.Numero}.pdf");
    }

    private async Task<OrdenServicio?> CargarCompleta(int id) =>
        await _db.Ordenes
            .Include(o => o.Vehiculo).ThenInclude(v => v!.Cliente)
            .Include(o => o.Checklist)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

    private async Task<string> SiguienteNumero()
    {
        var anio = DateTime.UtcNow.Year;
        var count = await _db.Ordenes.CountAsync(o => o.FechaIngreso.Year == anio);
        return $"OT-{anio}-{(count + 1):D4}";
    }
}
