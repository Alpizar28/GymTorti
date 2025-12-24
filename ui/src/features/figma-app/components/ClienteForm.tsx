"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente, ClienteFormData } from "../types";

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Cliente;
}

export function ClienteForm({ onSubmit, onCancel, initialData }: ClienteFormProps) {
  const { register, handleSubmit, formState } = useForm<ClienteFormData>({
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          apellido: initialData.apellido,
          email: initialData.email,
          telefono: initialData.telefono,
          foto: initialData.foto ?? "",
          contactoEmergencia: initialData.contactoEmergencia ?? "",
          observaciones: initialData.observaciones ?? "",
        }
      : {
          nombre: "",
          apellido: "",
          email: "",
          telefono: "",
          foto: "",
          contactoEmergencia: "",
          observaciones: "",
        },
  });

  const { errors } = formState;

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
