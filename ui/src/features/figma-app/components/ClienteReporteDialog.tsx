"use client";

import { Activity, Calendar, CreditCard, Download, Mail } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Cliente, Medicion, Pago } from "../types";

interface ClienteReporteDialogProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagos: Pago[];
  mediciones: Medicion[];
}

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function ClienteReporteDialog({ cliente, open, onOpenChange, pagos, mediciones }: ClienteReporteDialogProps) {
  const getEstadoBadge = (estado: Cliente["estado"]) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500 text-white">Activo</Badge>;
      case "por-vencer":
        return <Badge className="bg-yellow-500 text-white">Por vencer</Badge>;
      case "vencido":
        return <Badge className="bg-red-500 text-white">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const dataPeso = mediciones
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => ({
      fecha: new Date(m.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      peso: m.peso,
    }));

  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
  const ultimoPago = pagos.length > 0 ? pagos.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0] : null;

  const handleExportarReporte = () => {
    let reporte = `==============================================\n`;
    reporte += `REPORTE INDIVIDUAL - MASTERGYM\n`;
    reporte += `==============================================\n\n`;
    reporte += `DATOS PERSONALES\n`;
    reporte += `Nombre: ${cliente.nombre} ${cliente.apellido}\n`;
    reporte += `Correo: ${cliente.email}\n`;
    reporte += `Teléfono: ${cliente.telefono}\n`;
    reporte += `Estado: ${cliente.estado.toUpperCase()}\n\n`;

    reporte += `MEMBRESÍA\n`;
    reporte += `Tipo: ${cliente.tipoMembresia}\n`;
    reporte += `Fecha inicio: ${new Date(cliente.fechaInicio).toLocaleDateString("es-CR")}\n`;
    reporte += `Fecha vencimiento: ${
      cliente.fechaVencimiento ? new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR") : "Sin membresia"
    }\n\n`;

    if (cliente.contactoEmergencia) {
      reporte += `CONTACTO DE EMERGENCIA\n`;
      reporte += `${cliente.contactoEmergencia}\n\n`;
    }

    reporte += `HISTORIAL DE PAGOS (${pagos.length})\n`;
    reporte += `${"=".repeat(80)}\n`;
    pagos
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .forEach((pago) => {
        reporte += `${new Date(pago.fecha).toLocaleDateString("es-CR").padEnd(15)} | ${colones
          .format(pago.monto)
          .padEnd(15)} | ${pago.metodoPago.padEnd(15)} | ${pago.tipoPago}\n`;
      });
    reporte += `\nTotal pagado: ${colones.format(totalPagado)}\n\n`;

    reporte += `HISTORIAL DE MEDICIONES (${mediciones.length})\n`;
    reporte += `${"=".repeat(80)}\n`;
    mediciones
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .forEach((medicion) => {
        const imc = (medicion.peso / Math.pow(medicion.altura / 100, 2)).toFixed(1);
        reporte += `${new Date(medicion.fecha).toLocaleDateString("es-CR").padEnd(15)} | Peso: ${medicion.peso}kg | Altura: ${
          medicion.altura
        }cm | IMC: ${imc}\n`;
      });

    if (cliente.observaciones) {
      reporte += `\nOBSERVACIONES\n`;
      reporte += `${cliente.observaciones}\n`;
    }

    reporte += `\n==============================================\n`;
    reporte += `Reporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    reporte += `==============================================\n`;

    const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${cliente.nombre}-${cliente.apellido}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-black" style={{ fontSize: "1.5rem" }}>
                Reporte Individual
              </DialogTitle>
              <DialogDescription>Resumen completo de actividad del cliente</DialogDescription>
            </div>
            <Button
              onClick={handleExportarReporte}
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-6">
            {cliente.foto ? (
              <ImageWithFallback
                src={cliente.foto}
                alt={`${cliente.nombre} ${cliente.apellido}`}
                className="h-20 w-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] text-2xl font-bold text-white shadow-lg">
                {cliente.nombre[0]}
                {cliente.apellido[0]}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-900">
                {cliente.nombre} {cliente.apellido}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                {getEstadoBadge(cliente.estado)}
                <Badge variant="secondary" className="bg-white/60 text-gray-900">
                  {cliente.tipoMembresia}
                </Badge>
              </div>
              {ultimoPago && <p className="mt-2 text-sm text-gray-700">Último pago: {new Date(ultimoPago.fecha).toLocaleDateString("es-CR")}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#ff5e62]" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Correo</p>
                  <p className="font-semibold text-gray-900">{cliente.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="font-semibold text-gray-900">{cliente.telefono}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[#ff5e62]" />
                  Membresía
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Inicio</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(cliente.fechaInicio).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vencimiento</p>
                  <p className="font-semibold text-gray-900">
                    {cliente.fechaVencimiento
                      ? new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })
                      : "Sin membresia"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#ff5e62]" />
                  Historial de Pagos
                </CardTitle>
                <Badge className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white">
                  {pagos.length} pago{pagos.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No hay pagos registrados</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-4">
                    <p className="text-sm text-gray-600">Total pagado</p>
                    <p className="font-black text-gray-900" style={{ fontSize: "1.5rem" }}>
                      {colones.format(totalPagado)}
                    </p>
                  </div>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {pagos
                      .slice()
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((pago) => (
                        <div key={pago.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                          <div>
                            <p className="font-semibold text-gray-900">{colones.format(pago.monto)}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(pago.fecha).toLocaleDateString("es-CR")} • {pago.metodoPago} • {pago.tipoPago}
                            </p>
                          </div>
                          {pago.referencia && (
                            <Badge variant="outline" className="text-xs">
                              Ref: {pago.referencia}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#ff5e62]" />
                  Evolución de Peso
                </CardTitle>
                <Badge className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white">
                  {mediciones.length} medición{mediciones.length !== 1 ? "es" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {dataPeso.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No hay mediciones registradas</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dataPeso}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ background: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line type="monotone" dataKey="peso" stroke="#ff5e62" strokeWidth={3} dot={{ fill: "#ff5e62", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
