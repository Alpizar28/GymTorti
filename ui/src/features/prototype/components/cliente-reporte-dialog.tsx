"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/figma/image-with-fallback";
import { Activity, Calendar, CreditCard, Download, Mail, Phone, TrendingDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Cliente, Medicion, Pago } from "@/features/prototype/types";

type Props = {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagos: Pago[];
  mediciones: Medicion[];
};

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function ClienteReporteDialog({ cliente, open, onOpenChange, pagos, mediciones }: Props) {
  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
  const ultimoPago = pagos.length
    ? pagos.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null;

  const dataPeso = mediciones
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => ({
      fecha: new Date(m.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      peso: m.peso,
    }));

  function exportar() {
    let reporte = "";
    reporte += "==============================================\n";
    reporte += "REPORTE INDIVIDUAL - MASTERGYM\n";
    reporte += "==============================================\n\n";
    reporte += "DATOS PERSONALES\n";
    reporte += `Nombre: ${cliente.nombre} ${cliente.apellido}\n`;
    reporte += `Correo: ${cliente.email}\n`;
    reporte += `Teléfono: ${cliente.telefono}\n`;
    reporte += `Estado: ${cliente.estado.toUpperCase()}\n\n`;

    reporte += "MEMBRESÍA\n";
    reporte += `Tipo: ${cliente.tipoMembresia}\n`;
    reporte += `Fecha inicio: ${new Date(cliente.fechaInicio).toLocaleDateString("es-CR")}\n`;
    reporte += `Fecha vencimiento: ${new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR")}\n\n`;

    if (cliente.contactoEmergencia) {
      reporte += "CONTACTO DE EMERGENCIA\n";
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
          .padEnd(15)} | ${pago.metodoPago.padEnd(10)} | ${pago.tipoPago}\n`;
      });
    reporte += `\nTotal pagado: ${colones.format(totalPagado)}\n\n`;

    reporte += `HISTORIAL DE MEDICIONES (${mediciones.length})\n`;
    reporte += `${"=".repeat(80)}\n`;
    mediciones
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .forEach((m) => {
        const imc = (m.altura > 0 ? m.peso / Math.pow(m.altura / 100, 2) : 0).toFixed(1);
        reporte += `${new Date(m.fecha).toLocaleDateString("es-CR").padEnd(15)} | Peso: ${m.peso}kg | Altura: ${
          m.altura
        }cm | IMC: ${imc}\n`;
      });

    if (cliente.observaciones) {
      reporte += "\nOBSERVACIONES\n";
      reporte += `${cliente.observaciones}\n`;
    }

    reporte += "\n==============================================\n";
    reporte += `Reporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    reporte += "==============================================\n";

    const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${cliente.nombre}-${cliente.apellido}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-black" style={{ fontSize: "1.5rem" }}>
                Reporte Individual
              </DialogTitle>
              <DialogDescription>Informe completo del cliente</DialogDescription>
            </div>
            <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg" onClick={exportar}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
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
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900 border-none capitalize">
                      {cliente.tipoMembresia}
                    </Badge>
                    <Badge
                      className={
                        cliente.estado === "activo"
                          ? "bg-green-500 text-white"
                          : cliente.estado === "por-vencer"
                            ? "bg-yellow-500 text-white"
                            : cliente.estado === "vencido"
                              ? "bg-red-500 text-white"
                              : "bg-gray-200 text-gray-900"
                      }
                    >
                      {cliente.estado}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                      <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Correo</p>
                        <p className="text-sm font-semibold text-gray-900">{cliente.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                      <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Teléfono</p>
                        <p className="text-sm font-semibold text-gray-900">{cliente.telefono}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#ff5e62]" />
                  Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Total pagado</p>
                <p className="text-2xl font-black text-gray-900">{colones.format(totalPagado)}</p>
                {ultimoPago ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Último pago: <span className="font-semibold">{new Date(ultimoPago.fecha).toLocaleDateString("es-CR")}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">Sin pagos registrados</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#ff5e62]" />
                  Membresía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Vence</p>
                <p className="text-xl font-black text-gray-900">{new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR")}</p>
                {cliente.estado !== "activo" && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
                    <TrendingDown className="h-4 w-4" />
                    Requiere atención
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#ff5e62]" />
                  Mediciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Registradas</p>
                <p className="text-2xl font-black text-gray-900">{mediciones.length}</p>
                <p className="mt-2 text-sm text-gray-600">Evolución de peso</p>
              </CardContent>
            </Card>
          </div>

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
              {mediciones.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No hay mediciones registradas</p>
              ) : (
                <>
                  {dataPeso.length > 1 && (
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={dataPeso}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={["dataMin - 2", "dataMax + 2"]} />
                          <Tooltip
                            contentStyle={{
                              background: "white",
                              border: "none",
                              borderRadius: "12px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [`${value} kg`, "Peso"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="peso"
                            stroke="url(#gradientPeso)"
                            strokeWidth={3}
                            dot={{ fill: "#ff5e62", r: 5 }}
                          />
                          <defs>
                            <linearGradient id="gradientPeso" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ff5e62" />
                              <stop offset="100%" stopColor="#ff9966" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {mediciones
                      .slice()
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((m) => {
                        const imc = (m.altura > 0 ? m.peso / Math.pow(m.altura / 100, 2) : 0).toFixed(1);
                        return (
                          <div key={m.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {m.peso} kg • {m.altura} cm
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(m.fecha).toLocaleDateString("es-CR")} • IMC: {imc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {cliente.observaciones && (
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{cliente.observaciones}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {cliente.contactoEmergencia && (
            <Card className="border-none bg-red-50 shadow-md">
              <CardHeader>
                <CardTitle className="text-red-900">Contacto de Emergencia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-red-900">{cliente.contactoEmergencia}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

