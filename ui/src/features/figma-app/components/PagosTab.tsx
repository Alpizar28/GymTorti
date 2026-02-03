"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PagoForm } from "./PagoForm";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Cliente, Pago } from "../types";
import { getPrimaryGradient, appConfig } from "@/config/app.config";

interface PagosTabProps {
  pagos: Pago[];
  onCreatePago: (pago: Omit<Pago, "id">) => void | Promise<void>;
  onDeletePago: (id: string) => void | Promise<void>;
  clientes: Cliente[];
}

// Currency formatter based on app config
const currencyFormatter = new Intl.NumberFormat(
  appConfig.product.currency.code === "USD" ? "en-US" : "es-CR",
  {
    style: "currency",
    currency: appConfig.product.currency.code,
    minimumFractionDigits: appConfig.product.currency.decimals,
    maximumFractionDigits: appConfig.product.currency.decimals
  }
);
const DEFAULT_PERIOD_DAYS = 30;
const PERIOD_STORAGE_KEY = "mastergym.payments.periodDays";
const QUICK_PERIODS = ["7", "15", "30", "60", "90"] as const;
type PeriodPreset = (typeof QUICK_PERIODS)[number] | "custom";

function clampDays(value: number) {
  return Math.min(365, Math.max(1, Math.round(value)));
}

function resolvePreset(days: number): PeriodPreset {
  const asString = String(days) as (typeof QUICK_PERIODS)[number];
  return QUICK_PERIODS.includes(asString) ? asString : "custom";
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(year, month, day);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatShortDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function isoDateFromDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PagosTab({ pagos, onCreatePago, onDeletePago, clientes }: PagosTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentFormKey, setPaymentFormKey] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(resolvePreset(DEFAULT_PERIOD_DAYS));
  const [customDays, setCustomDays] = useState(String(DEFAULT_PERIOD_DAYS));
  const [periodReady, setPeriodReady] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddPago = async (pago: Omit<Pago, "id">) => {
    await onCreatePago(pago);
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await onDeletePago(deleteId);
      setDeleteId(null);
    }
  };

  useEffect(() => {
    if (dialogOpen) {
      setPaymentFormKey((prev) => prev + 1);
    }
  }, [dialogOpen]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PERIOD_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) {
          const clamped = clampDays(parsed);
          setPeriodDays(clamped);
          setCustomDays(String(clamped));
          setPeriodPreset(resolvePreset(clamped));
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setPeriodReady(true);
    }
  }, []);

  useEffect(() => {
    if (!periodReady) return;
    try {
      window.localStorage.setItem(PERIOD_STORAGE_KEY, String(periodDays));
    } catch {
      // ignore storage errors
    }
  }, [periodDays, periodReady]);

  useEffect(() => {
    setTablePage(0);
  }, [periodDays, pagos]);

  const tablePageSize = 10;

  const pagosFiltrados = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - (periodDays - 1));
    return pagos
      .map((p) => ({ ...p, parsedFecha: parseLocalDate(p.fecha) }))
      .filter((p) => p.parsedFecha !== null)
      .filter((p) => {
        const parsed = p.parsedFecha;
        if (!parsed) return false;
        parsed.setHours(0, 0, 0, 0);
        return parsed >= fromDate && parsed <= today;
      })
      .sort((a, b) => (b.parsedFecha as Date).getTime() - (a.parsedFecha as Date).getTime());
  }, [pagos, periodDays]);

  const totalMovements = pagosFiltrados.length;
  const totalAmount = useMemo(() => pagosFiltrados.reduce((sum, p) => sum + p.monto, 0), [pagosFiltrados]);
  const periodLabel = periodDays === 1 ? "Ultimo dia" : `Ultimos ${periodDays} dias`;
  const totalTablePages = Math.max(1, Math.ceil(totalMovements / tablePageSize));
  const pagosPaginados = useMemo(() => {
    const startIndex = tablePage * tablePageSize;
    return pagosFiltrados.slice(startIndex, startIndex + tablePageSize);
  }, [pagosFiltrados, tablePage, tablePageSize]);

  useEffect(() => {
    if (tablePage > totalTablePages - 1) {
      setTablePage(Math.max(totalTablePages - 1, 0));
    }
  }, [tablePage, totalTablePages]);

  const ingresosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    pagosFiltrados.forEach((pago) => {
      const parsed = (pago as Pago & { parsedFecha?: Date }).parsedFecha;
      if (!parsed) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + pago.monto);
    });

    if (periodDays <= 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - (periodDays - 1));

    const data: { dia: string; ingresos: number }[] = [];
    for (let i = 0; i < periodDays; i += 1) {
      const date = new Date(fromDate);
      date.setDate(fromDate.getDate() + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      data.push({ dia: formatShortDate(date), ingresos: map.get(key) ?? 0 });
    }
    return data.filter((d) => d.ingresos > 0);
  }, [pagosFiltrados, periodDays]);

  function handlePresetChange(value: PeriodPreset) {
    setPeriodPreset(value);
    if (value === "custom") {
      const parsed = Number(customDays);
      if (Number.isFinite(parsed)) {
        setPeriodDays(clampDays(parsed));
      }
      return;
    }
    const nextDays = Number(value);
    if (!Number.isFinite(nextDays)) return;
    setPeriodDays(nextDays);
    setCustomDays(String(nextDays));
  }

  function handleCustomDaysChange(value: string) {
    setCustomDays(value);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setPeriodDays(clampDays(parsed));
  }

  function handleCustomDaysBlur() {
    if (!customDays.trim()) {
      setCustomDays(String(periodDays));
      return;
    }
    const parsed = Number(customDays);
    if (!Number.isFinite(parsed)) {
      setCustomDays(String(periodDays));
      return;
    }
    const clamped = clampDays(parsed);
    setCustomDays(String(clamped));
    setPeriodDays(clamped);
  }

  const handleDownloadExcel = () => {
    const rows = [
      ["Fecha", "Cliente", "Metodo", "Descripcion/Referencia", "Monto"],
      ...pagosFiltrados.map((pago) => [
        new Date(pago.fecha).toLocaleDateString("es-CR"),
        getClienteNombre(pago.clienteId),
        pago.metodoPago,
        pago.referencia ?? "\u2014",
        currencyFormatter.format(pago.monto),
      ]),
      ["Total", "", "", "", currencyFormatter.format(totalAmount)],
    ];

    // Convertir a CSV
    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (periodDays - 1));
    const fileName = `reporte_pagos_periodo_${isoDateFromDate(startDate)}_a_${isoDateFromDate(endDate)}.csv`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "\u2014";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
          <CardHeader className="border-b border-border bg-surface-hover">
            <CardTitle className="text-sm text-muted">Ingresos del periodo</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="font-black text-foreground" style={{ fontSize: "1.75rem" }}>
              {colones.format(totalAmount)}
            </p>
            <p className="mt-1 text-sm text-muted">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
          <CardHeader className="border-b border-border bg-surface-hover">
            <CardTitle className="text-sm text-muted">Cantidad de movimientos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="font-black text-foreground" style={{ fontSize: "1.75rem" }}>
              {totalMovements}
            </p>
            <p className="mt-1 text-sm text-muted">{periodLabel}</p>
          </CardContent>
        </Card>
      </div>
      {ingresosPorDia.length > 0 && (
        <Card className="overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
          <CardHeader className="border-b border-border bg-surface-hover">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-black text-foreground" style={{ fontSize: "1.5rem" }}>
                  Ingresos del periodo
                </CardTitle>
                <p className="mt-1 text-sm text-muted">{periodLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Total</p>
                <p className="font-black text-foreground" style={{ fontSize: "1.5rem" }}>
                  {colones.format(totalAmount)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ingresosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "var(--text-muted)" }} stroke="var(--text-muted)" label={{ value: "Dia del periodo", position: "insideBottom", offset: -5, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} stroke="var(--text-muted)" tickFormatter={(value) => colones.format(value as number)} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", color: "var(--text)" }}
                  itemStyle={{ color: "var(--text)" }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  formatter={(value: number) => [colones.format(value), "Ingresos"]}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Bar dataKey="ingresos" fill="url(#gradientBar)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={appConfig.theme.primary.from} />
                    <stop offset="100%" stopColor={appConfig.theme.primary.to} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
        <CardHeader className="border-b border-border bg-surface-hover">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="font-black text-foreground" style={{ fontSize: "1.5rem" }}>
                Gestión de Pagos
              </CardTitle>
              <p className="mt-1 text-sm text-muted">Registro y control de ingresos</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Periodo (dias)</span>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
                    value={periodPreset}
                    onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)}
                  >
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="60">60 dias</option>
                    <option value="90">90 dias</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  {periodPreset === "custom" && (
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => handleCustomDaysChange(e.target.value)}
                      onBlur={handleCustomDaysBlur}
                      className="w-28 rounded-xl border-border bg-surface text-foreground"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadExcel} className="rounded-xl">
                <Download className="mr-2 h-5 w-5" />
                Descargar Excel
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl text-white shadow-lg transition-all hover:shadow-xl" style={{ background: getPrimaryGradient() }}>
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Nuevo Pago</DialogTitle>
                    <DialogDescription>Registra un nuevo pago de membresía</DialogDescription>
                  </DialogHeader>
                  <PagoForm
                    key={paymentFormKey}
                    onSubmit={handleAddPago}
                    onCancel={() => setDialogOpen(false)}
                    clientes={clientes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: getPrimaryGradient() }}>
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-muted">No hay pagos registrados. Registra el primer pago.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-hover hover:bg-surface-hover border-border">
                      <TableHead className="rounded-tl-3xl text-muted">Fecha</TableHead>
                      <TableHead className="text-muted">Cliente</TableHead>
                      <TableHead className="text-muted">Metodo</TableHead>
                      <TableHead className="text-muted">Descripcion/Referencia</TableHead>
                      <TableHead className="text-right text-muted">Monto</TableHead>
                      <TableHead className="rounded-tr-3xl text-right text-muted">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosPaginados.map((pago) => (
                      <TableRow key={pago.id} className="transition-colors hover:bg-surface-hover border-border">
                        <TableCell>
                          <div className="text-sm text-foreground">{new Date(pago.fecha).toLocaleDateString("es-CR")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{getClienteNombre(pago.clienteId)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-foreground border-border">
                            {pago.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted">{pago.referencia ?? "\u2014"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-foreground">{colones.format(pago.monto)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(pago.id)}
                            className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pagosPaginados.length === 0 && (
                      <TableRow>
                        <TableCell className="py-10 text-center text-muted" colSpan={6}>
                          Sin pagos en el periodo seleccionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 text-sm text-muted">
                <div>
                  Pagina <span className="font-semibold">{tablePage + 1}</span> de{" "}
                  <span className="font-semibold">{totalTablePages}</span> -{" "}
                  <span className="font-semibold">{totalMovements}</span> movimientos
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                    disabled={tablePage <= 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setTablePage((p) => Math.min(Math.max(totalTablePages - 1, 0), p + 1))}
                    disabled={tablePage >= totalTablePages - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar pago?"
        description="Esta acción eliminará el registro de pago permanentemente. ¿Está seguro?"
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
}
