"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import type { Page, PaymentCreateRequest, PaymentCurrency, PaymentMethod, PaymentResponse, PaymentStatus, PaymentType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

type CreateForm = {
  clientId: string;
  amount: string;
  currency: PaymentCurrency;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  reference: string;
  notes: string;
  paymentDate: string;
};

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const EMPTY_CREATE: CreateForm = {
  clientId: "",
  amount: "",
  currency: "CRC",
  paymentMethod: "CASH",
  paymentType: "MONTHLY_MEMBERSHIP",
  status: "PAID",
  reference: "",
  notes: "",
  paymentDate: todayIsoDate(),
};

function friendlyError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

export function PagosTabBackend() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Page<PaymentResponse>>("/api/payments?page=0&size=200&sort=paymentDate,desc");
      setPayments(data.content);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const monthLabel = now.toLocaleString("es-CR", { month: "long", year: "numeric" });

  const paymentsThisMonth = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [now, payments]);

  const ingresosMes = useMemo(() => paymentsThisMonth.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [paymentsThisMonth]);

  const ingresosPorDia = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const byDay = new Map<number, number>();
    for (let i = 1; i <= daysInMonth; i++) byDay.set(i, 0);

    for (const pago of paymentsThisMonth) {
      const d = new Date(pago.paymentDate);
      const day = d.getDate();
      byDay.set(day, (byDay.get(day) ?? 0) + (Number(pago.amount) || 0));
    }

    return Array.from(byDay.entries())
      .map(([dia, ingresos]) => ({ dia: String(dia), ingresos }))
      .filter((x) => x.ingresos > 0);
  }, [now, paymentsThisMonth]);

  function generarReporte() {
    let reporte = "";
    reporte += "==============================================\n";
    reporte += "REPORTE DE PAGOS - MASTERGYM\n";
    reporte += "==============================================\n\n";
    reporte += `Periodo: ${monthLabel}\n`;
    reporte += `Total de pagos: ${paymentsThisMonth.length}\n`;
    reporte += `Ingreso total: ${colones.format(ingresosMes)}\n\n`;
    reporte += "DETALLE:\n";
    reporte += `${"Fecha".padEnd(14)} | ${"Pago".padEnd(8)} | ${"Cliente".padEnd(8)} | ${"Monto".padEnd(16)} | ${"Método".padEnd(10)} | ${"Tipo".padEnd(18)} | ${"Estado".padEnd(10)} | Ref\n`;
    reporte += `${"-".repeat(120)}\n`;

    paymentsThisMonth
      .slice()
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .forEach((p) => {
        const date = new Date(p.paymentDate).toLocaleDateString("es-CR").padEnd(14);
        const id = `#${p.id}`.padEnd(8);
        const clientId = String(p.clientId).padEnd(8);
        const amount = colones.format(Number(p.amount) || 0).padEnd(16);
        const method = String(p.paymentMethod).padEnd(10);
        const type = String(p.paymentType).padEnd(18);
        const status = String(p.status).padEnd(10);
        const ref = (p.reference ?? "").trim();
        reporte += `${date} | ${id} | ${clientId} | ${amount} | ${method} | ${type} | ${status} | ${ref}\n`;
      });

    reporte += `\nReporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    reporte += "==============================================\n";

    const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-pagos-${now.getMonth() + 1}-${now.getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreate() {
    const clientId = Number(createForm.clientId);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      setError("clientId inválido.");
      return;
    }
    if (!createForm.amount.trim()) {
      setError("amount es obligatorio.");
      return;
    }
    if (!createForm.paymentDate.trim()) {
      setError("paymentDate es obligatorio.");
      return;
    }
    setError(null);
    try {
      const body: PaymentCreateRequest = {
        clientId,
        amount: createForm.amount.trim(),
        currency: createForm.currency,
        paymentMethod: createForm.paymentMethod,
        paymentType: createForm.paymentType,
        status: createForm.status,
        reference: createForm.reference.trim() || undefined,
        notes: createForm.notes.trim() || undefined,
        paymentDate: createForm.paymentDate,
      };
      await apiSend("/api/payments", "POST", body);
      setCreateForm(EMPTY_CREATE);
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleDelete(payment: PaymentResponse) {
    const ok = window.confirm("¿Estás seguro de eliminar este pago?");
    if (!ok) return;
    setError(null);
    try {
      await apiSend(`/api/payments/${payment.id}`, "DELETE");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const statusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-900 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-900 border-yellow-200";
      case "REFUNDED":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "CANCELLED":
      default:
        return "bg-gray-100 text-gray-900 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-gray-900">Pagos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Vista Figma conectada al backend</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={generarReporte} disabled={paymentsThisMonth.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar reporte
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Registrar Pago</DialogTitle>
                    <DialogDescription>Registra el pago en el backend</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ClientId *</Label>
                      <Input
                        value={createForm.clientId}
                        onChange={(e) => setCreateForm((p) => ({ ...p, clientId: e.target.value }))}
                        className="rounded-xl"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Monto *</Label>
                      <Input
                        value={createForm.amount}
                        onChange={(e) => setCreateForm((p) => ({ ...p, amount: e.target.value }))}
                        className="rounded-xl"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={createForm.currency}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, currency: v as PaymentCurrency }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRC">CRC</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Método</Label>
                      <Select
                        value={createForm.paymentMethod}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, paymentMethod: v as PaymentMethod }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">CASH</SelectItem>
                          <SelectItem value="SINPE">SINPE</SelectItem>
                          <SelectItem value="CARD">CARD</SelectItem>
                          <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                          <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={createForm.paymentType}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, paymentType: v as PaymentType }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY_MEMBERSHIP">MONTHLY_MEMBERSHIP</SelectItem>
                          <SelectItem value="REGISTRATION">REGISTRATION</SelectItem>
                          <SelectItem value="PENALTY">PENALTY</SelectItem>
                          <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={createForm.status}
                        onValueChange={(v) => setCreateForm((p) => ({ ...p, status: v as PaymentStatus }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAID">PAID</SelectItem>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                          <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Fecha *</Label>
                      <Input
                        type="date"
                        value={createForm.paymentDate}
                        onChange={(e) => setCreateForm((p) => ({ ...p, paymentDate: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Referencia (opcional)</Label>
                      <Input
                        value={createForm.reference}
                        onChange={(e) => setCreateForm((p) => ({ ...p, reference: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Notas (opcional)</Label>
                      <Input
                        value={createForm.notes}
                        onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl shadow-lg"
                      onClick={handleCreate}
                    >
                      Guardar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Ingresos del Mes</p>
                <div className="p-2 bg-gradient-to-br from-[#ff9966] to-[#ff5e62] rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="font-black text-gray-900 mt-2" style={{ fontSize: "2rem" }}>
                {colones.format(ingresosMes)}
              </p>
              <p className="text-sm text-gray-700 mt-1 capitalize">{monthLabel}</p>
              <p className="text-sm text-gray-600 mt-3">
                {paymentsThisMonth.length} pago{paymentsThisMonth.length !== 1 ? "s" : ""} este mes
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Ingresos diarios</p>
              {ingresosPorDia.length === 0 ? (
                <p className="text-sm text-gray-500 mt-6 text-center">Sin datos para graficar</p>
              ) : (
                <div className="h-40 mt-2">
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
          <div>
            <CardTitle className="text-xl text-gray-900">Historial</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Pagos registrados</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">No hay pagos registrados. Registra el primer pago.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Pago</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-gray-900">#{p.id}</div>
                        <div className="text-xs text-gray-500">{p.paymentType}</div>
                        <div className="text-xs text-gray-500">{p.paymentMethod}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">#{p.clientId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-gray-900">{new Date(p.paymentDate).toLocaleDateString("es-CR")}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-lg text-[#ff5e62]">
                          {colones.format(Number(p.amount) || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusBadgeClass(p.status)} font-semibold`}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
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

