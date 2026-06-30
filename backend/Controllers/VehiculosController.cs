using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TallerApi.Data;
using TallerApi.Models;

namespace TallerApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly TallerDbContext _db;
    public VehiculosController(TallerDbContext db) => _db = db;

    // Buscar por placa -> ficha del vehiculo + cliente + historial de ordenes
    [HttpGet("historial")]
    public async Task<ActionResult<HistorialDto>> Historial([FromQuery] string placa)
    {
        if (string.IsNullOrWhiteSpace(placa)) return BadRequest("Placa requerida.");
        placa = placa.Trim().ToUpperInvariant();

        var vehiculo = await _db.Vehiculos
            .Include(v => v.Cliente)
            .Include(v => v.Ordenes)
            .FirstOrDefaultAsync(v => v.Placa == placa);

        if (vehiculo is null) return NotFound("No hay registro para esa placa.");

        var ordenes = vehiculo.Ordenes
            .OrderByDescending(o => o.FechaIngreso)
            .Select(o => o.ToResumen())
            .ToList();

        return new HistorialDto(vehiculo.ToDto(), vehiculo.Cliente!.ToDto(), ordenes);
    }
}

[ApiController]
[Route("api/[controller]")]
public class CatalogoController : ControllerBase
{
    [HttpGet("checklist")]
    public ActionResult<string[]> Checklist() => Catalogo.ChecklistRutinario;
}
