"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cliente, Pago } from "../types";

interface PagoFormProps {
  onSubmit: (data: Omit<Pago, "id">) => void;
  onCancel: () => void;
  clientes: Cliente[];
}

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

function localDateValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PagoForm({ onSubmit, onCancel, clientes }: PagoFormProps) {
  const today = localDateValue();
  const { register, handleSubmit, setValue, control, formState } = useForm<Omit<Pago, "id">>({
    defaultValues: {
      clienteId: "",
      monto: 0,
      fecha: localDateValue(),
      tipoPago: "mensual",
      metodoPago: "efectivo",
      referencia: "",
    },
  });

  const clienteId = useWatch({ control, name: "clienteId" });
  const tipoPago = useWatch({ control, name: "tipoPago" });
  const metodoPago = useWatch({ control, name: "metodoPago" });
  const { errors } = formState;

  const montosRecomendados: Record<string, number> = {
    diario: 1000,
    mensual: 12500,
    trimestral: 35000,
    semestral: 65000,
    anual: 120000,
  };

  const clienteSeleccionado = useMemo(() => {
    if (!clienteId) return null;
    return clientes.find((c) => c.id === clienteId) ?? null;
  }, [clienteId, clientes]);

  const handleFormSubmit = (data: Omit<Pago, "id">) => {
    if (!clienteSeleccionado) return;
    const monto = montosRecomendados[tipoPago] ?? 0;
    onSubmit({ ...data, monto });
  };

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clienteId">Cliente *</Label>
        <Select value={clienteId} onValueChange={(value) => setValue("clienteId", value)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes
              .slice()
              .sort((a, b) => {
                if (a.estado === "vencido" && b.estado !== "vencido") return -1;
                if (b.estado === "vencido" && a.estado !== "vencido") return 1;
                if (a.estado === "por-vencer" && b.estado === "activo") return -1;
                if (b.estado === "por-vencer" && a.estado === "activo") return 1;
                return 0;
              })
              .map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} {cliente.estado === "vencido" && "⏰"} {cliente.estado === "por-vencer" && "⚠️"}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.clienteId && <p className="text-sm text-red-600">Debes seleccionar un cliente</p>}
      </div>

      {clienteSeleccionado && (
        <div className="space-y-3 rounded-2xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado actual</p>
              <div className="mt-1">{getEstadoBadge(clienteSeleccionado.estado)}</div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Vence el</p>
              <p className="font-bold text-gray-900">
                {clienteSeleccionado.fechaVencimiento
                  ? new Date(clienteSeleccionado.fechaVencimiento).toLocaleDateString("es-CR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Sin membresia"}
              </p>
            </div>
          </div>

          {clienteSeleccionado.estado === "vencido" && (
            <div className="flex items-start gap-2 rounded-xl bg-red-100 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">Membresía vencida</p>
                <p className="text-xs text-red-700">Se renovará desde hoy ({new Date().toLocaleDateString("es-CR")})</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha del Pago *</Label>
        <Input
          id="fecha"
          type="date"
          max={today}
          {...register("fecha", {
            required: "La fecha es requerida",
            validate: (value) => (value <= today ? true : "La fecha no puede ser futura"),
          })}
          className="rounded-xl"
        />
        {errors.fecha && <p className="text-sm text-red-600">{errors.fecha.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoPago">Tipo de Membresía *</Label>
        <Select
          value={tipoPago}
          onValueChange={(value) => {
            setValue("tipoPago", value as Pago["tipoPago"]);
            setValue("monto", montosRecomendados[value]);
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diario">Diario (1 día) - {colones.format(1000)}</SelectItem>
            <SelectItem value="mensual">Mensual (1 mes) - {colones.format(12500)}</SelectItem>
            <SelectItem value="trimestral">Trimestral (3 meses) - {colones.format(35000)}</SelectItem>
            <SelectItem value="semestral">Semestral (6 meses) - {colones.format(65000)}</SelectItem>
            <SelectItem value="anual">Anual (12 meses) - {colones.format(120000)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Monto</Label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
          {colones.format(montosRecomendados[tipoPago] ?? 0)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metodoPago">Método de Pago *</Label>
        <Select value={metodoPago} onValueChange={(value) => setValue("metodoPago", value as Pago["metodoPago"])}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="sinpe">SINPE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referencia">Referencia (opcional)</Label>
        <Input id="referencia" {...register("referencia")} placeholder="Número de referencia" className="rounded-xl" />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg">
          Registrar Pago
        </Button>
      </div>
    </form>
  );
}
