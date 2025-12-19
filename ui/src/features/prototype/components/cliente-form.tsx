"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente, ClientState, MembershipType } from "@/features/prototype/types";

type FormValues = Omit<Cliente, "id">;

type Props = {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Cliente;
};

function calcDueDate(startIso: string, type: MembershipType) {
  const date = new Date(startIso);
  const months: Record<MembershipType, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
  date.setMonth(date.getMonth() + months[type]);
  return date.toISOString().split("T")[0];
}

export function ClienteForm({ onSubmit, onCancel, initialData }: Props) {
  const { register, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    defaultValues:
      initialData ?? {
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

  const estado = watch("estado");
  const tipoMembresia = watch("tipoMembresia");
  const fechaInicio = watch("fechaInicio");

  useEffect(() => {
    if (!fechaInicio || !tipoMembresia) return;
    setValue("fechaVencimiento", calcDueDate(fechaInicio, tipoMembresia));
  }, [fechaInicio, setValue, tipoMembresia]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register("nombre", { required: "El nombre es requerido" })} placeholder="Juan" className="rounded-xl" />
          {formState.errors.nombre && <p className="text-sm text-red-600">{formState.errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" {...register("apellido", { required: "El apellido es requerido" })} placeholder="Pérez" className="rounded-xl" />
          {formState.errors.apellido && <p className="text-sm text-red-600">{formState.errors.apellido.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "El correo es requerido",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Correo inválido",
              },
            })}
            placeholder="juan@ejemplo.com"
            className="rounded-xl"
          />
          {formState.errors.email && <p className="text-sm text-red-600">{formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input id="telefono" {...register("telefono", { required: "El teléfono es requerido" })} placeholder="+506 8888-8888" className="rounded-xl" />
          {formState.errors.telefono && <p className="text-sm text-red-600">{formState.errors.telefono.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foto">URL de Foto (opcional)</Label>
        <Input id="foto" type="url" {...register("foto")} placeholder="https://..." className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoMembresia">Tipo de Membresía *</Label>
        <Select
          value={tipoMembresia}
          onValueChange={(value) => setValue("tipoMembresia", value as MembershipType)}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
          <Input id="fechaInicio" type="date" {...register("fechaInicio", { required: "La fecha es requerida" })} className="rounded-xl" />
          {formState.errors.fechaInicio && <p className="text-sm text-red-600">{formState.errors.fechaInicio.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
          <Input
            id="fechaVencimiento"
            type="date"
            {...register("fechaVencimiento", { required: "La fecha es requerida" })}
            className="rounded-xl bg-gray-50"
          />
          {formState.errors.fechaVencimiento && <p className="text-sm text-red-600">{formState.errors.fechaVencimiento.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactoEmergencia">Contacto de Emergencia (opcional)</Label>
        <Input id="contactoEmergencia" {...register("contactoEmergencia")} placeholder="Nombre y teléfono" className="rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
        <Textarea id="observaciones" {...register("observaciones")} placeholder="Notas adicionales" className="min-h-[100px] rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select value={estado} onValueChange={(value) => setValue("estado", value as ClientState)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="por-vencer">Por vencer</SelectItem>
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
          {initialData ? "Guardar Cambios" : "Agregar Cliente"}
        </Button>
      </div>
    </form>
  );
}

