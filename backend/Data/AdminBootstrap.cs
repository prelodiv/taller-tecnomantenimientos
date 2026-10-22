using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TallerApi.Models;

namespace TallerApi.Data;

public static class AdminBootstrap
{
    public static async Task RunAsync(TallerDbContext db, IConfiguration config)
    {
        // Adición idempotente para las bases del MVP creadas antes del login.
        // EnsureCreated no agrega tablas a bases que ya contienen órdenes.
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "Usuarios" (
                "Username" TEXT NOT NULL PRIMARY KEY,
                "PasswordHash" TEXT NOT NULL,
                "Role" TEXT NOT NULL
            );
            """);
        var username = config["Admin:Username"]?.Trim().ToLowerInvariant();
        var password = config["Admin:Password"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrEmpty(password)) return;
        if (await db.Usuarios.AnyAsync(u => u.Username == username)) return;

        var user = new Usuario { Username = username, Role = "Admin" };
        user.PasswordHash = new PasswordHasher<Usuario>().HashPassword(user, password);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync();
    }
}
