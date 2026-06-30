using Microsoft.EntityFrameworkCore;
using TallerApi.Models;

namespace TallerApi.Data;

public class TallerDbContext : DbContext
{
    public TallerDbContext(DbContextOptions<TallerDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<OrdenServicio> Ordenes => Set<OrdenServicio>();
    public DbSet<OrdenChecklist> Checklist => Set<OrdenChecklist>();
    public DbSet<ItemFactura> Items => Set<ItemFactura>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Vehiculo>().HasIndex(v => v.Placa);
        b.Entity<ItemFactura>().Property(i => i.Cantidad).HasPrecision(18, 2);
        b.Entity<ItemFactura>().Property(i => i.ValorUnitario).HasPrecision(18, 2);

        // Enums como texto -> mas legible en la BD y en debugging
        b.Entity<Vehiculo>().Property(v => v.Tipo).HasConversion<string>();
        b.Entity<OrdenServicio>().Property(o => o.Estado).HasConversion<string>();
        b.Entity<ItemFactura>().Property(i => i.Tipo).HasConversion<string>();
    }
}
