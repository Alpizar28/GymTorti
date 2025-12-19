"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Plus, Trash2 } from "lucide-react";
import type { Cliente, Pago } from "@/features/prototype/types";
import { PagoForm } from "@/features/prototype/components/pago-form";

type Props = {
  pagos: Pago[];
  setPagos: (pagos: Pago[]) => void;
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
};

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function PagosTab({ pagos, setPagos, clientes, setClientes }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const now = new Date();
  const monthLabel = now.toLocaleString("es-CR", { month: "long", year: "numeric" });

  const pagosMes = useMemo(() => {
    return pagos.filter((p) => {
      const d = new Date(p.fecha);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [now, pagos]);

  const ingresosMes = useMemo(() => pagosMes.reduce((sum, p) => sum + p.monto, 0), [pagosMes]);

  const ingresosPorDia = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const byDay = new Map<number, number>();
    for (let i = 1; i <= daysInMonth; i++) byDay.set(i, 0);

    for (const pago of pagosMes) {
      const d = new Date(pago.fecha);
      const day = d.getDate();
      byDay.set(day, (byDay.get(day) ?? 0) + pago.monto);
    }

    return Array.from(byDay.entries())
      .map(([dia, ingresos]) => ({ dia: String(dia), ingresos }))
      .filter((x) => x.ingresos > 0);
  }, [now, pagosMes]);

  function handleAddPago(pago: Omit<Pago, "id">) {
    setPagos([...pagos, { ...pago, id: crypto.randomUUID() }]);
    setDialogOpen(false);
  }

  function handleDeletePago(id: string) {
    const ok = window.confirm("¿Estás seguro de eliminar este pago?");
    if (!ok) return;
    setPagos(pagos.filter((p) => p.id !== id));
  }

  function getClienteNombre(clienteId: string) {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "Desconocido";
  }

  function getTipoPagoBadgeClass(tipo: Pago["tipoPago"]) {
    switch (tipo) {
      case "mensual":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "trimestral":
        return "bg-purple-100 text-purple-900 border-purple-200";
      case "semestral":
        return "bg-orange-100 text-orange-900 border-orange-200";
      case "anual":
        return "bg-green-100 text-green-900 border-green-200";
      default:
        return "bg-gray-100 text-gray-900 border-gray-200";
    }
  }

  function generarReporte() {
    const pagosOrdenados = pagosMes
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    let reporte = "";
    reporte += "==============================================\n";
    reporte += "REPORTE DE INGRESOS - MASTERGYM\n";
    reporte += "==============================================\n\n";
    reporte += `Periodo: ${monthLabel}\n`;
    reporte += `Total de pagos: ${pagosOrdenados.length}\n`;
    reporte += `Ingreso total: ${colones.format(ingresosMes)}\n\n`;
    reporte += "DETALLE DE PAGOS:\n";
    reporte += `${"=".repeat(110)}\n`;
    reporte += `${"Fecha".padEnd(15)} | ${"Cliente".padEnd(30)} | ${"Monto".padEnd(15)} | ${"Método".padEnd(10)} | ${"Tipo".padEnd(12)} | Ref\n`;
    reporte += `${"-".repeat(110)}\n`;

    for (const pago of pagosOrdenados) {
      const nombreCliente = getClienteNombre(pago.clienteId);
      reporte += `${new Date(pago.fecha).toLocaleDateString("es-CR").padEnd(15)} | ${nombreCliente.padEnd(30)} | ${colones
        .format(pago.monto)
        .padEnd(15)} | ${pago.metodoPago.padEnd(10)} | ${pago.tipoPago.padEnd(12)} | ${pago.referencia ?? ""}\n`;
    }

    reporte += `\nReporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    reporte += "==============================================\n";

    const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ingresos-${now.getMonth() + 1}-${now.getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-gray-900">Pagos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Registro y control de ingresos (modo prototipo)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={generarReporte} disabled={pagosMes.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar reporte
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={clientes.length === 0}
                    className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Registrar Pago</DialogTitle>
                    <DialogDescription>Registra el pago y renueva la membresía</DialogDescription>
                  </DialogHeader>
                  <PagoForm
                    onSubmit={handleAddPago}
                    onCancel={() => setDialogOpen(false)}
                    clientes={clientes}
                    setClientes={setClientes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Ingresos del Mes</p>
                <div className="rounded-xl bg-gradient-to-br from-[#ff9966] to-[#ff5e62] p-2">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-black text-gray-900">{colones.format(ingresosMes)}</p>
              <p className="mt-1 text-sm text-gray-700 capitalize">{monthLabel}</p>
              <p className="mt-3 text-sm text-gray-600">
                {pagosMes.length} pago{pagosMes.length !== 1 ? "s" : ""} este mes
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Ingresos diarios</p>
              {ingresosPorDia.length === 0 ? (
                <p className="mt-6 text-center text-sm text-gray-500">Sin datos para graficar</p>
              ) : (
                <div className="mt-2 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ingresosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number) => [colones.format(value), "Ingresos"]}
                      />
                      <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} fill="url(#gradientIngresos)" />
                      <defs>
                        <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff5e62" />
                          <stop offset="100%" stopColor="#ff9966" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-gray-900">Historial</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Pagos registrados</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">Primero debes agregar clientes para registrar pagos.</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">No hay pagos registrados. Registra el primer pago.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Renovó hasta</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos
                  .slice()
                  .reverse()
                  .map((pago) => (
                    <TableRow key={pago.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-gray-900">{getClienteNombre(pago.clienteId)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(pago.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoPagoBadgeClass(pago.tipoPago)} capitalize font-semibold`}>{pago.tipoPago}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-gray-900 font-semibold">{pago.metodoPago}</span>
                      </TableCell>
                      <TableCell>
                        {pago.referencia ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {pago.referencia}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pago.fechaVencimientoNueva ? (
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(pago.fechaVencimientoNueva).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-lg text-[#ff5e62]">{colones.format(pago.monto)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePago(pago.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

