using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;
using TallerApi.Data;
using TallerApi.Services;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

var databaseProvider = builder.Configuration["Database:Provider"] ?? "Sqlite";
builder.Services.AddDbContext<TallerDbContext>(opt =>
{
    if (databaseProvider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
    {
        var connection = builder.Configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException("Configure ConnectionStrings__Postgres para usar PostgreSQL.");
        opt.UseNpgsql(connection, pg => pg.EnableRetryOnFailure(3));
    }
    else if (databaseProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        opt.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=taller.db");
    else
        throw new InvalidOperationException("Database__Provider debe ser Sqlite o Postgres.");
});

builder.Services.AddScoped<PdfService>();
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddOpenApi();

const string CorsPolicy = "frontend";
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Crear BD + sembrar datos de demo
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TallerDbContext>();
    await db.Database.EnsureCreatedAsync();
    if (builder.Configuration.GetValue("Database:SeedDemo", app.Environment.IsDevelopment()))
        await Seed.RunAsync(db);
}

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors(CorsPolicy);
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
