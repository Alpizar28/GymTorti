"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cliente, MembershipType, Pago, PaymentMethod } from "@/features/prototype/types";

type FormValues = Omit<Pago, "id">;

type Props = {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
};

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function PagoForm({ onSubmit, onCancel, clientes, setClientes }: Props) {
  const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    defaultValues: {
      clienteId: "",
      monto: 0,
      fecha: new Date().toISOString().split("T")[0],
      tipoPago: "mensual",
      metodoPago: "efectivo",
      referencia: "",
    },
  });

  const clienteId = watch("clienteId");
  const tipoPago = watch("tipoPago");
  const metodoPago = watch("metodoPago");

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState<string>("");

  const montosRecomendados: Record<MembershipType, number> = useMemo(
    () => ({ mensual: 12500, trimestral: 35000, semestral: 65000, anual: 120000 }),
    [],
  );

  useEffect(() => {
    if (!clienteId) {
      setClienteSeleccionado(null);
      setNuevaFechaVencimiento("");
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId) ?? null;
    setClienteSeleccionado(cliente);
  }, [clienteId, clientes]);

  useEffect(() => {
    if (!clienteSeleccionado) return;

    const months: Record<MembershipType, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
    const today = new Date();
    const currentDue = new Date(clienteSeleccionado.fechaVencimiento);
    const base = currentDue > today ? currentDue : today;
    const next = new Date(base);
    next.setMonth(next.getMonth() + months[tipoPago]);
    setNuevaFechaVencimiento(next.toISOString().split("T")[0]);
  }, [clienteSeleccionado, tipoPago]);

  const handleFormSubmit = (data: FormValues) => {
    if (!clienteSeleccionado) return;

    setClientes(
      clientes.map((c) =>
        c.id === clienteSeleccionado.id ? { ...c, fechaVencimiento: nuevaFechaVencimiento, estado: "activo" } : c,
      ),
    );

    onSubmit({
      ...data,
      fechaVencimientoAnterior: clienteSeleccionado.fechaVencimiento,
      fechaVencimientoNueva: nuevaFechaVencimiento,
    });
  };

  const estadoBadge =
    !clienteSeleccionado ? null : clienteSeleccionado.estado === "activo" ? (
      <Badge className="bg-green-500 text-white">Activo</Badge>
    ) : clienteSeleccionado.estado === "por-vencer" ? (
      <Badge className="bg-yellow-500 text-white">Por vencer</Badge>
    ) : clienteSeleccionado.estado === "vencido" ? (
      <Badge className="bg-red-500 text-white">Vencido</Badge>
    ) : (
      <Badge className="bg-gray-200 text-gray-900">Inactivo</Badge>
    );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clienteId">Cliente *</Label>
        <Select value={clienteId} onValueChange={(value) => setValue("clienteId", value, { shouldValidate: true })}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes
              .filter((c) => c.estado !== "inactivo")
              .sort((a, b) => {
                const score = (s: Cliente["estado"]) => (s === "vencido" ? 0 : s === "por-vencer" ? 1 : 2);
                return score(a.estado) - score(b.estado);
              })
              .map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {formState.errors.clienteId && <p className="text-sm text-red-600">Debes seleccionar un cliente</p>}
      </div>

      {clienteSeleccionado && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">Estado actual</p>
              <div className="mt-1 flex items-center gap-2">
                {estadoBadge}
                <Badge className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900 border-none capitalize">
                  {clienteSeleccionado.tipoMembresia}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Vence</p>
              <p className="font-semibold text-gray-900">{new Date(clienteSeleccionado.fechaVencimiento).toLocaleDateString("es-CR")}</p>
            </div>
          </div>

          {clienteSeleccionado.estado === "vencido" && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">Membresía vencida</p>
                <p className="text-xs text-red-700">
                  Se renovará desde hoy ({new Date().toLocaleDateString("es-CR")})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha del Pago *</Label>
        <Input id="fecha" type="date" {...register("fecha", { required: "La fecha es requerida" })} className="rounded-xl" />
        {formState.errors.fecha && <p className="text-sm text-red-600">{formState.errors.fecha.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoPago">Tipo de Membresía *</Label>
        <Select
          value={tipoPago}
          onValueChange={(value) => {
            const v = value as MembershipType;
            setValue("tipoPago", v);
            setValue("monto", montosRecomendados[v]);
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensual">Mensual (1 mes) - {colones.format(montosRecomendados.mensual)}</SelectItem>
            <SelectItem value="trimestral">Trimestral (3 meses) - {colones.format(montosRecomendados.trimestral)}</SelectItem>
            <SelectItem value="semestral">Semestral (6 meses) - {colones.format(montosRecomendados.semestral)}</SelectItem>
            <SelectItem value="anual">Anual (12 meses) - {colones.format(montosRecomendados.anual)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {nuevaFechaVencimiento && (
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Nueva fecha de vencimiento</p>
              <p className="font-black text-green-900" style={{ fontSize: "1.25rem" }}>
                {new Date(nuevaFechaVencimiento).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="mt-1 text-xs text-green-700">La membresía se extenderá automáticamente</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="metodoPago">Método de Pago *</Label>
        <Select value={metodoPago} onValueChange={(value) => setValue("metodoPago", value as PaymentMethod)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="sinpe">SINPE Móvil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(metodoPago === "tarjeta" || metodoPago === "sinpe") && (
        <div className="space-y-2">
          <Label htmlFor="referencia">Referencia / Número de Transacción (opcional)</Label>
          <Input id="referencia" {...register("referencia")} placeholder="Ej: 1234567890" className="rounded-xl font-mono" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="monto">Monto en Colones (CRC) *</Label>
        <Input
          id="monto"
          type="number"
          step="100"
          {...register("monto", { required: "El monto es requerido", min: { value: 100, message: "El monto debe ser mayor a 100" } })}
          placeholder="12500"
          className="rounded-xl font-bold text-lg"
        />
        {formState.errors.monto && <p className="text-sm text-red-600">{formState.errors.monto.message}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
          disabled={!clienteSeleccionado}
        >
          Registrar Pago y Renovar
        </Button>
      </div>
    </form>
  );
}

