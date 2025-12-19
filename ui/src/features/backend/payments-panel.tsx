"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Hash,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import type {
  Page,
  PaymentCreateRequest,
  PaymentCurrency,
  PaymentMethod,
  PaymentResponse,
  PaymentStatus,
  PaymentType,
  PaymentUpdateRequest,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function friendlyError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatAmount(amount: string, currency: PaymentCurrency) {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currency}`;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function statusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    PAID: "bg-green-500 text-white border-none",
    PENDING: "bg-amber-500 text-white border-none",
    CANCELLED: "bg-gray-200 text-gray-900",
    REFUNDED: "bg-blue-500 text-white border-none",
  };
  return <Badge className={`rounded-xl ${map[status] ?? ""}`}>{status}</Badge>;
}

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

export function PaymentsPanel() {
  const [search, setSearch] = useState("");
  const [clientIdFilter, setClientIdFilter] = useState("");
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<PaymentUpdateRequest>({});
  const [editing, setEditing] = useState<PaymentResponse | null>(null);

  const query = useMemo(() => {
    const q = search.trim();
    const clientId = clientIdFilter.trim();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(pageSize));
    params.set("sort", "paymentDate,desc");
    if (q) params.set("search", q);
    if (clientId) params.set("clientId", clientId);
    return `/api/payments?${params.toString()}`;
  }, [clientIdFilter, page, pageSize, search]);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Page<PaymentResponse>>(query);
      setPayments(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [search, clientIdFilter]);

  const counts = useMemo(() => {
    const pending = payments.filter((p) => p.status === "PENDING").length;
    const refunded = payments.filter((p) => p.status === "REFUNDED").length;
    return { total: totalElements, pending, refunded };
  }, [payments, totalElements]);

  function downloadMonthlyReport() {
    const now = new Date();
    const monthLabel = now.toLocaleString("es-CR", { month: "long", year: "numeric" });
    const paymentsThisMonth = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const total = paymentsThisMonth.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    let report = "";
    report += "==============================================\n";
    report += "REPORTE DE PAGOS - MASTERGYM\n";
    report += "==============================================\n\n";
    report += `Periodo: ${monthLabel}\n`;
    report += `Total de pagos: ${paymentsThisMonth.length}\n`;
    report += `Monto total (CRC): ${new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "CRC",
    }).format(total)}\n\n`;
    report += "DETALLE:\n";
    report += `${"Fecha".padEnd(14)} | ${"Pago".padEnd(8)} | ${"Cliente".padEnd(8)} | ${"Monto".padEnd(16)} | ${"Método".padEnd(10)} | ${"Tipo".padEnd(18)} | ${"Estado".padEnd(10)} | Ref\n`;
    report += `${"-".repeat(120)}\n`;

    paymentsThisMonth
      .slice()
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .forEach((p) => {
        const date = new Date(p.paymentDate).toLocaleDateString("es-CR").padEnd(14);
        const id = `#${p.id}`.padEnd(8);
        const clientId = String(p.clientId).padEnd(8);
        const amount = formatAmount(p.amount, p.currency).padEnd(16);
        const method = String(p.paymentMethod).padEnd(10);
        const type = String(p.paymentType).padEnd(18);
        const status = String(p.status).padEnd(10);
        const ref = (p.reference ?? "").trim();
        report += `${date} | ${id} | ${clientId} | ${amount} | ${method} | ${type} | ${status} | ${ref}\n`;
      });

    report += `\nReporte generado el ${new Date().toLocaleString("es-CR")}\n`;
    report += "==============================================\n";

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
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
      await apiSend<PaymentResponse>("/api/payments", "POST", body);
      setCreateForm(EMPTY_CREATE);
      setCreateOpen(false);
      await loadPayments();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function startEdit(target: PaymentResponse) {
    setEditing(target);
    setEditForm({
      clientId: target.clientId,
      amount: target.amount,
      currency: target.currency,
      paymentMethod: target.paymentMethod,
      paymentType: target.paymentType,
      status: target.status,
      reference: target.reference ?? "",
      notes: target.notes ?? "",
      paymentDate: target.paymentDate,
    });
    setEditOpen(true);
  }

  function resetEdit() {
    setEditing(null);
    setEditForm({});
    setEditOpen(false);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setError(null);
    try {
      await apiSend(`/api/payments/${editing.id}`, "PUT", editForm);
      resetEdit();
      await loadPayments();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleDelete(target: PaymentResponse) {
    const ok = window.confirm(`Eliminar el pago #${target.id}?`);
    if (!ok) return;
    setError(null);
    try {
      await apiSend(`/api/payments/${target.id}`, "DELETE");
      await loadPayments();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Total pagos</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-sm text-gray-500">Registrados en el backend</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Pendientes</CardTitle>
            <Badge className="rounded-full bg-amber-500 text-white border-none">{counts.pending}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Status PENDING</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Reembolsos</CardTitle>
            <Badge className="rounded-full bg-blue-500 text-white border-none">{counts.refunded}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Status REFUNDED</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="gap-4 border-b bg-gradient-to-r from-white to-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Pagos</CardTitle>
            <p className="text-sm text-gray-500">Búsqueda, alta y edición conectadas al backend.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={loadPayments} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading ? "Actualizando..." : "Refrescar"}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={downloadMonthlyReport} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Descargar reporte
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo pago
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por referencia o notas"
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={clientIdFilter}
                onChange={(e) => setClientIdFilter(e.target.value)}
                placeholder="Filtrar por clientId (opcional)"
                className="pl-9 rounded-xl"
                inputMode="numeric"
              />
            </div>
          </div>

          <Table containerClassName="overflow-hidden rounded-3xl border bg-white shadow-sm" className="w-full text-sm">
            <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="rounded-tl-3xl">Pago</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-gray-900">#{p.id}</div>
                    <div className="text-xs text-gray-500">{formatDate(p.paymentDate)}</div>
                    {p.reference && <div className="text-xs text-gray-500">{p.reference}</div>}
                  </TableCell>
                  <TableCell className="text-gray-700">{p.clientId}</TableCell>
                  <TableCell className="font-semibold text-gray-900">{formatAmount(p.amount, p.currency)}</TableCell>
                  <TableCell className="text-gray-700">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>{p.paymentType}</span>
                    </div>
                    <div className="text-xs text-gray-500">{p.paymentMethod}</div>
                  </TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => startEdit(p)}>
                        <NotebookPen className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && !loading && (
                <TableRow>
                  <TableCell className="py-6 text-center text-gray-500" colSpan={6}>
                    Sin pagos aún. Crea uno nuevo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              Página <span className="font-semibold">{page + 1}</span> de{" "}
              <span className="font-semibold">{Math.max(totalPages, 1)}</span> â€¢{" "}
              <span className="font-semibold">{totalElements}</span> pagos
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={loading || page <= 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.min(Math.max(totalPages - 1, 0), p + 1))}
                disabled={loading || page >= totalPages - 1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo pago</DialogTitle>
            <DialogDescription>Se guardará en el backend (POST /api/payments).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="clientId *"
                value={createForm.clientId}
                onChange={(e) => setCreateForm((p) => ({ ...p, clientId: e.target.value }))}
                className="rounded-xl pl-9"
                inputMode="numeric"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="amount * (ej: 25000.00)"
                value={createForm.amount}
                onChange={(e) => setCreateForm((p) => ({ ...p, amount: e.target.value }))}
                className="rounded-xl pl-9"
                inputMode="decimal"
              />
            </div>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={createForm.currency}
              onChange={(e) => setCreateForm((p) => ({ ...p, currency: e.target.value as PaymentCurrency }))}
            >
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={createForm.paymentMethod}
              onChange={(e) => setCreateForm((p) => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
            >
              <option value="CASH">CASH</option>
              <option value="SINPE">SINPE</option>
              <option value="CARD">CARD</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={createForm.paymentType}
              onChange={(e) => setCreateForm((p) => ({ ...p, paymentType: e.target.value as PaymentType }))}
            >
              <option value="MONTHLY_MEMBERSHIP">MONTHLY_MEMBERSHIP</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="PENALTY">PENALTY</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={createForm.status}
              onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value as PaymentStatus }))}
            >
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            <div className="relative sm:col-span-2">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                placeholder="paymentDate"
                value={createForm.paymentDate}
                onChange={(e) => setCreateForm((p) => ({ ...p, paymentDate: e.target.value }))}
                className="rounded-xl pl-9"
              />
            </div>

            <Input
              placeholder="reference"
              value={createForm.reference}
              onChange={(e) => setCreateForm((p) => ({ ...p, reference: e.target.value }))}
              className="rounded-xl sm:col-span-2"
            />
            <Textarea
              placeholder="notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
              className="rounded-xl sm:col-span-2"
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg" onClick={handleCreate}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : resetEdit())}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar pago</DialogTitle>
            <DialogDescription>PUT /api/payments/{editing?.id} (usa header X-GYM-ID)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="clientId"
                value={editForm.clientId ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, clientId: Number(e.target.value) }))}
                className="rounded-xl pl-9"
                inputMode="numeric"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="amount"
                value={editForm.amount ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                className="rounded-xl pl-9"
                inputMode="decimal"
              />
            </div>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={(editForm.currency ?? "CRC") as PaymentCurrency}
              onChange={(e) => setEditForm((p) => ({ ...p, currency: e.target.value as PaymentCurrency }))}
            >
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={(editForm.paymentMethod ?? "CASH") as PaymentMethod}
              onChange={(e) => setEditForm((p) => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
            >
              <option value="CASH">CASH</option>
              <option value="SINPE">SINPE</option>
              <option value="CARD">CARD</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={(editForm.paymentType ?? "MONTHLY_MEMBERSHIP") as PaymentType}
              onChange={(e) => setEditForm((p) => ({ ...p, paymentType: e.target.value as PaymentType }))}
            >
              <option value="MONTHLY_MEMBERSHIP">MONTHLY_MEMBERSHIP</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="PENALTY">PENALTY</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={(editForm.status ?? "PAID") as PaymentStatus}
              onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as PaymentStatus }))}
            >
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            <div className="relative sm:col-span-2">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                placeholder="paymentDate"
                value={editForm.paymentDate ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, paymentDate: e.target.value }))}
                className="rounded-xl pl-9"
              />
            </div>

            <Input
              placeholder="reference"
              value={(editForm.reference ?? "") as string}
              onChange={(e) => setEditForm((p) => ({ ...p, reference: e.target.value }))}
              className="rounded-xl sm:col-span-2"
            />
            <Textarea
              placeholder="notes"
              value={(editForm.notes ?? "") as string}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              className="rounded-xl sm:col-span-2"
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={resetEdit}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg" onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



