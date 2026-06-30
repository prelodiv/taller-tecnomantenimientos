using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TallerApi.Models;

namespace TallerApi.Services;

public class PdfService
{
    // Paleta de marca (uniforme del taller)
    private static readonly string Rojo = "#D32027";
    private static readonly string Negro = "#1A1A1A";
    private static readonly string Gris = "#6B6B6B";
    private static readonly string GrisClaro = "#EFEFEF";

    private static readonly CultureInfo Co = new("es-CO");
    private static string Money(decimal v) => "$ " + v.ToString("N0", Co);

    public byte[] GenerarEntrada(OrdenServicio o)
    {
        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Negro));

                Encabezado(page, "COMPROBANTE DE ENTRADA", o.Numero);

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(12);

                    // Datos cliente + vehiculo
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Element(c => Recuadro(c, "CLIENTE", inner =>
                        {
                            Campo(inner, "Nombre", o.Vehiculo!.Cliente!.Nombre);
                            Campo(inner, "Teléfono", o.Vehiculo.Cliente.Telefono);
                            if (!string.IsNullOrWhiteSpace(o.Vehiculo.Cliente.Documento))
                                Campo(inner, "Documento", o.Vehiculo.Cliente.Documento!);
                        }));
                        row.ConstantItem(15);
                        row.RelativeItem().Element(c => Recuadro(c, "VEHÍCULO", inner =>
                        {
                            Campo(inner, "Placa", o.Vehiculo!.Placa);
                            Campo(inner, "Tipo", o.Vehiculo.Tipo.ToString());
                            Campo(inner, "Marca / Modelo", $"{o.Vehiculo.Marca} {o.Vehiculo.Modelo}");
                            if (o.Vehiculo.Anio is not null) Campo(inner, "Año", o.Vehiculo.Anio.ToString()!);
                            if (!string.IsNullOrWhiteSpace(o.Vehiculo.Color)) Campo(inner, "Color", o.Vehiculo.Color!);
                        }));
                    });

                    // Ingreso
                    col.Item().Element(c => Recuadro(c, "DATOS DE INGRESO", inner =>
                    {
                        Campo(inner, "Fecha de ingreso", o.FechaIngreso.ToString("dd/MM/yyyy hh:mm tt", Co));
                        Campo(inner, "Kilometraje", $"{o.Kilometraje:N0} km");
                        if (!string.IsNullOrWhiteSpace(o.NivelCombustible))
                            Campo(inner, "Nivel de combustible", o.NivelCombustible!);
                    }));

                    // Checklist
                    var marcados = o.Checklist.Where(c => c.Marcado).ToList();
                    if (marcados.Count > 0)
                    {
                        col.Item().Element(c => Recuadro(c, "TRABAJOS A REALIZAR (CHECKLIST)", inner =>
                        {
                            foreach (var item in marcados)
                                inner.Item().Row(r =>
                                {
                                    r.ConstantItem(16).Text("✓").FontColor(Rojo).Bold();
                                    r.RelativeItem().Text(item.Nombre);
                                });
                        }));
                    }

                    // Extras / observaciones del cliente
                    if (!string.IsNullOrWhiteSpace(o.DescripcionExtras))
                    {
                        col.Item().Element(c => Recuadro(c, "OBSERVACIONES DEL CLIENTE", inner =>
                            inner.Item().Text(o.DescripcionExtras!)));
                    }

                    // Firmas
                    col.Item().PaddingTop(30).Row(row =>
                    {
                        row.RelativeItem().Column(s =>
                        {
                            s.Item().LineHorizontal(1).LineColor(Negro);
                            s.Item().PaddingTop(3).AlignCenter().Text("Recibe (Taller)").FontColor(Gris).FontSize(9);
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(s =>
                        {
                            s.Item().LineHorizontal(1).LineColor(Negro);
                            s.Item().PaddingTop(3).AlignCenter().Text("Entrega (Cliente)").FontColor(Gris).FontSize(9);
                        });
                    });
                });

                PiePagina(page);
            });
        }).GeneratePdf();
    }

    public byte[] GenerarFactura(OrdenServicio o)
    {
        var repuestos = o.Items.Where(i => i.Tipo == TipoItem.Repuesto).ToList();
        var manoObra = o.Items.Where(i => i.Tipo == TipoItem.ManoObra).ToList();
        var totalRep = repuestos.Sum(i => i.Subtotal);
        var totalMo = manoObra.Sum(i => i.Subtotal);
        var total = totalRep + totalMo;

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Negro));

                Encabezado(page, "COTIZACIÓN / FACTURA", o.Numero);

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Element(c => Recuadro(c, "CLIENTE", inner =>
                        {
                            Campo(inner, "Nombre", o.Vehiculo!.Cliente!.Nombre);
                            Campo(inner, "Teléfono", o.Vehiculo.Cliente.Telefono);
                        }));
                        row.ConstantItem(15);
                        row.RelativeItem().Element(c => Recuadro(c, "VEHÍCULO", inner =>
                        {
                            Campo(inner, "Placa", o.Vehiculo!.Placa);
                            Campo(inner, "Marca / Modelo", $"{o.Vehiculo.Marca} {o.Vehiculo.Modelo}");
                            Campo(inner, "Kilometraje", $"{o.Kilometraje:N0} km");
                        }));
                    });

                    if (repuestos.Count > 0)
                        col.Item().Element(c => TablaItems(c, "REPUESTOS", repuestos, totalRep));

                    if (manoObra.Count > 0)
                        col.Item().Element(c => TablaItems(c, "MANO DE OBRA", manoObra, totalMo));

                    // Totales
                    col.Item().AlignRight().Width(260).Column(t =>
                    {
                        FilaTotal(t, "Subtotal repuestos", totalRep, false);
                        FilaTotal(t, "Subtotal mano de obra", totalMo, false);
                        t.Item().PaddingTop(4).Background(Rojo).Padding(8).Row(r =>
                        {
                            r.RelativeItem().Text("TOTAL").FontColor(Colors.White).Bold().FontSize(13);
                            r.ConstantItem(120).AlignRight().Text(Money(total)).FontColor(Colors.White).Bold().FontSize(13);
                        });
                    });

                    col.Item().PaddingTop(10).Text("Cotización válida por 15 días. Precios en pesos colombianos (COP).")
                        .FontColor(Gris).FontSize(8).Italic();
                });

                PiePagina(page);
            });
        }).GeneratePdf();
    }

    // ---------- Bloques reutilizables ----------

    private void Encabezado(PageDescriptor page, string titulo, string numero)
    {
        page.Header().Column(col =>
        {
            col.Item().Row(row =>
            {
                // "Logo" tipografico TM
                row.AutoItem().Height(54).Width(54).Background(Negro).AlignCenter().AlignMiddle()
                    .Text("TM").FontColor(Rojo).Bold().FontSize(26);
                row.ConstantItem(12);
                row.RelativeItem().AlignMiddle().Column(c =>
                {
                    c.Item().Text(t =>
                    {
                        t.Span("TECNO ").FontColor(Negro).Bold().FontSize(18);
                        t.Span("MANTENIMIENTOS").FontColor(Rojo).Bold().FontSize(18);
                    });
                    c.Item().Text("P.R. S.A.S — Mantenimientos, Reparaciones y Suministros").FontColor(Gris).FontSize(8);
                    c.Item().Text("Cra 10 N° 11A-47 · La Dorada, Caldas · Tel 314 511 5004").FontColor(Gris).FontSize(8);
                });
                row.AutoItem().AlignRight().AlignMiddle().Column(c =>
                {
                    c.Item().AlignRight().Text(titulo).FontColor(Rojo).Bold().FontSize(13);
                    c.Item().AlignRight().Text($"N° {numero}").FontColor(Negro).Bold().FontSize(11);
                });
            });
            col.Item().PaddingTop(8).LineHorizontal(2.5f).LineColor(Rojo);
        });
    }

    private void PiePagina(PageDescriptor page)
    {
        page.Footer().Column(col =>
        {
            col.Item().LineHorizontal(1).LineColor(GrisClaro);
            col.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text("Juan Pablo 322 522 2145  ·  Santiago 311 342 4803").FontColor(Gris).FontSize(8);
                row.RelativeItem().AlignRight().Text(t =>
                {
                    t.Span("Generado ").FontColor(Gris).FontSize(8);
                    t.Span(DateTime.Now.ToString("dd/MM/yyyy hh:mm tt", Co)).FontColor(Gris).FontSize(8);
                });
            });
        });
    }

    private void Recuadro(IContainer c, string titulo, Action<ColumnDescriptor> contenido)
    {
        c.Border(1).BorderColor(GrisClaro).Column(col =>
        {
            col.Item().Background(Negro).Padding(6).Text(titulo).FontColor(Colors.White).Bold().FontSize(10);
            col.Item().Padding(8).Column(inner =>
            {
                inner.Spacing(3);
                contenido(inner);
            });
        });
    }

    private void Campo(ColumnDescriptor col, string etiqueta, string valor)
    {
        col.Item().Row(r =>
        {
            r.ConstantItem(130).Text($"{etiqueta}:").FontColor(Gris);
            r.RelativeItem().Text(valor).Bold();
        });
    }

    private void TablaItems(IContainer c, string titulo, List<ItemFactura> items, decimal total)
    {
        c.Column(col =>
        {
            col.Item().Background(Negro).Padding(6).Text(titulo).FontColor(Colors.White).Bold();
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(5);
                    cols.RelativeColumn(1.3f);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(2);
                });

                table.Header(h =>
                {
                    h.Cell().Background(GrisClaro).Padding(5).Text("Descripción").Bold();
                    h.Cell().Background(GrisClaro).Padding(5).AlignCenter().Text("Cant.").Bold();
                    h.Cell().Background(GrisClaro).Padding(5).AlignRight().Text("V. Unitario").Bold();
                    h.Cell().Background(GrisClaro).Padding(5).AlignRight().Text("Subtotal").Bold();
                });

                foreach (var it in items)
                {
                    table.Cell().BorderBottom(1).BorderColor(GrisClaro).Padding(5).Text(it.Descripcion);
                    table.Cell().BorderBottom(1).BorderColor(GrisClaro).Padding(5).AlignCenter().Text(it.Cantidad.ToString("0.##", Co));
                    table.Cell().BorderBottom(1).BorderColor(GrisClaro).Padding(5).AlignRight().Text(Money(it.ValorUnitario));
                    table.Cell().BorderBottom(1).BorderColor(GrisClaro).Padding(5).AlignRight().Text(Money(it.Subtotal)).Bold();
                }
            });
        });
    }

    private void FilaTotal(ColumnDescriptor col, string etiqueta, decimal valor, bool bold)
    {
        col.Item().Row(r =>
        {
            r.RelativeItem().Text(etiqueta).FontColor(Gris);
            r.ConstantItem(120).AlignRight().Text(Money(valor));
        });
    }
}
