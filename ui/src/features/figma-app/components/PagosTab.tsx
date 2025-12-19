"use client";

import { useState } from "react";
import { BarChart3, Download, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PagoForm } from "./PagoForm";
import type { Cliente, Pago } from "../types";

interface PagosTabProps {
  pagos: Pago[];
  onCreatePago: (pago: Omit<Pago, "id">) => void | Promise<void>;
  onDeletePago: (id: string) => void | Promise<void>;
  clientes: Cliente[];
  onUpdateCliente: (clienteId: string, patch: Partial<Cliente>) => void;
}

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function PagosTab({ pagos, onCreatePago, onDeletePago, clientes, onUpdateCliente }: PagosTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddPago = async (pago: Omit<Pago, "id">) => {
    await onCreatePago(pago);
    setDialogOpen(false);
  };

  const handleDeletePago = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este pago?")) {
      await onDeletePago(id);
    }
  };

  const handleGenerarReporte = () => {
    const now = new Date();
    const mesActual = now.toLocaleString("es-CR", { month: "long", year: "numeric" });

    const pagosMes = pagos.filter((p) => {
      const pagoDate = new Date(p.fecha);
      return pagoDate.getMonth() === now.getMonth() && pagoDate.getFullYear() === now.getFullYear();
    });

    const ingresoTotal = pagosMes.reduce((sum, p) => sum + p.monto, 0);

    let reporte = `==============================================\n`;
    reporte += `REPORTE DE INGRESOS - MASTERGYM\n`;
    reporte += `Poder y Pasión\n`;
    reporte += `==============================================\n\n`;
    reporte += `Periodo: ${mesActual}\n`;
    reporte += `Total de pagos: ${pagosMes.length}\n`;
    reporte += `Ingreso total: ${colones.format(ingresoTotal)}\n\n`;
    reporte += `DETALLE DE PAGOS:\n`;
    reporte += `${"=".repeat(100)}\n`;
    reporte += `${"Fecha".padEnd(15)} | ${"Cliente".padEnd(30)} | ${"Monto".padEnd(15)} | ${"Método".padEnd(15)} | ${"Tipo".padEnd(15)}\n`;
    reporte += `${"-".repeat(100)}\n`;

    pagosMes
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .forEach((pago) => {
        const cliente = clientes.find((c) => c.id === pago.clienteId);
        const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : "Desconocido";
        reporte += `${new Date(pago.fecha).toLocaleDateString("es-CR").padEnd(15)} | ${nombreCliente.padEnd(30)} | ${colones
          .format(pago.monto)
          .padEnd(15)} | ${pago.metodoPago.padEnd(15)} | ${pago.tipoPago.padEnd(15)}\n`;
      });

    reporte += `\n${"=".repeat(100)}\n`;
    reporte += `Reporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    reporte += `==============================================\n`;

    const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ingresos-${now.getMonth() + 1}-${now.getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado";
  };

  const getTipoPagoBadgeClass = (tipo: string) => {
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
  };

  const now = new Date();
  const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ingresosPorDia = Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1;
    const ingresos = pagos
      .filter((p) => {
        const pagoDate = new Date(p.fecha);
        return (
          pagoDate.getMonth() === now.getMonth() &&
          pagoDate.getFullYear() === now.getFullYear() &&
          pagoDate.getDate() === dia
        );
      })
      .reduce((sum, p) => sum + p.monto, 0);

    return { dia: dia.toString(), ingresos };
  }).filter((d) => d.ingresos > 0);

  const ingresosMes = pagos
    .filter((p) => {
      const pagoDate = new Date(p.fecha);
      return pagoDate.getMonth() === now.getMonth() && pagoDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-6">
      {ingresosPorDia.length > 0 && (
        <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-black text-gray-900" style={{ fontSize: "1.5rem" }}>
                  Ingresos del Mes
                </CardTitle>
                <p className="mt-1 text-sm text-gray-600">{now.toLocaleString("es-CR", { month: "long", year: "numeric" })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-black text-gray-900" style={{ fontSize: "1.5rem" }}>
                  {colones.format(ingresosMes)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ingresosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" label={{ value: "Día del mes", position: "insideBottom", offset: -5 }} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(value) => colones.format(value as number)} />
                <Tooltip
                  contentStyle={{ background: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [colones.format(value), "Ingresos"]}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Bar dataKey="ingresos" fill="url(#gradientBar)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5e62" />
                    <stop offset="100%" stopColor="#ff9966" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="font-black text-gray-900" style={{ fontSize: "1.5rem" }}>
                Gestión de Pagos
              </CardTitle>
              <p className="mt-1 text-sm text-gray-600">Registro y control de ingresos</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleGenerarReporte} className="rounded-xl">
                <Download className="mr-2 h-5 w-5" />
                Descargar Reporte
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg transition-all hover:shadow-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Nuevo Pago</DialogTitle>
                    <DialogDescription>Registra un nuevo pago de membresía</DialogDescription>
                  </DialogHeader>
                  <PagoForm onSubmit={handleAddPago} onCancel={() => setDialogOpen(false)} clientes={clientes} onUpdateCliente={onUpdateCliente} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966]">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-gray-500">No hay pagos registrados. Registra el primer pago.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="rounded-tr-3xl text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos
                    .slice()
                    .reverse()
                    .map((pago) => (
                      <TableRow key={pago.id} className="transition-colors hover:bg-gray-50">
                        <TableCell>
                          <div className="font-semibold text-gray-900">{getClienteNombre(pago.clienteId)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{new Date(pago.fecha).toLocaleDateString("es-CR")}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-gray-900">{colones.format(pago.monto)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {pago.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTipoPagoBadgeClass(pago.tipoPago)} capitalize`}>{pago.tipoPago}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{pago.referencia || "-"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePago(pago.id)} className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

