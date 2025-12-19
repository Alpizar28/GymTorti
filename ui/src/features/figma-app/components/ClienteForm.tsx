"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente } from "../types";

interface ClienteFormProps {
  onSubmit: (data: Omit<Cliente, "id">) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Cliente;
}

export function ClienteForm({ onSubmit, onCancel, initialData }: ClienteFormProps) {
  const { register, handleSubmit, setValue, watch, formState } = useForm<Omit<Cliente, "id">>({
    defaultValues: initialData || {
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaVencimiento: "",
      estado: "activo",
      tipoMembresia: "mensual",
      foto: "",
      contactoEmergencia: "",
      observaciones: "",
    },
  });

  const { errors } = formState;
  const estado = watch("estado");
  const tipoMembresia = watch("tipoMembresia");
  const fechaInicio = watch("fechaInicio");

  const calcularFechaVencimiento = (inicio: string, tipo: string) => {
    const fecha = new Date(inicio);
    const mesesMap = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
    fecha.setMonth(fecha.getMonth() + mesesMap[tipo as keyof typeof mesesMap]);
    return fecha.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register("nombre", { required: "El nombre es requerido" })} placeholder="Juan" className="rounded-xl" />
          {errors.nombre && <p className="text-sm text-red-600">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            {...register("apellido", { required: "El apellido es requerido" })}
            placeholder="Pérez"
            className="rounded-xl"
          />
          {errors.apellido && <p className="text-sm text-red-600">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "El correo es requerido",
              setValueAs: (value) => (typeof value === "string" ? value.trim() : value),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Correo inválido",
              },
            })}
            placeholder="juan@ejemplo.com"
            className="rounded-xl"
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            {...register("telefono", { required: "El teléfono es requerido" })}
            placeholder="+506 8888 8888"
            className="rounded-xl"
          />
          {errors.telefono && <p className="text-sm text-red-600">{errors.telefono.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foto">URL de Foto (opcional)</Label>
        <Input id="foto" type="url" {...register("foto")} placeholder="https://ejemplo.com/foto.jpg" className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoMembresia">Tipo de Membresía *</Label>
        <Select
          value={tipoMembresia}
          onValueChange={(value) => {
            setValue("tipoMembresia", value as Cliente["tipoMembresia"]);
            if (fechaInicio) setValue("fechaVencimiento", calcularFechaVencimiento(fechaInicio, value));
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensual">Mensual (1 mes)</SelectItem>
            <SelectItem value="trimestral">Trimestral (3 meses)</SelectItem>
            <SelectItem value="semestral">Semestral (6 meses)</SelectItem>
            <SelectItem value="anual">Anual (12 meses)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
          <Input
            id="fechaInicio"
            type="date"
            {...register("fechaInicio", { required: "La fecha es requerida" })}
            onChange={(e) => {
              setValue("fechaInicio", e.target.value);
              setValue("fechaVencimiento", calcularFechaVencimiento(e.target.value, tipoMembresia));
            }}
            className="rounded-xl"
          />
          {errors.fechaInicio && <p className="text-sm text-red-600">{errors.fechaInicio.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
          <Input
            id="fechaVencimiento"
            type="date"
            {...register("fechaVencimiento", { required: "La fecha es requerida" })}
            className="rounded-xl bg-gray-50"
          />
          {errors.fechaVencimiento && <p className="text-sm text-red-600">{errors.fechaVencimiento.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactoEmergencia">Contacto de Emergencia (opcional)</Label>
        <Input
          id="contactoEmergencia"
          {...register("contactoEmergencia")}
          placeholder="Nombre y teléfono: María Pérez - 8888 8888"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
        <Textarea
          id="observaciones"
          {...register("observaciones")}
          placeholder="Notas adicionales, condiciones médicas, objetivos, etc."
          className="min-h-[100px] rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select value={estado} onValueChange={(value) => setValue("estado", value as Cliente["estado"])}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg">
          {initialData ? "Actualizar Cliente" : "Registrar Cliente"}
        </Button>
      </div>
    </form>
  );
}
