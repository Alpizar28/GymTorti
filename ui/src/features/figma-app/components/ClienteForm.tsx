"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente, ClienteFormData } from "../types";
import { getPrimaryGradient } from "@/config/app.config";

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Cliente;
}

function splitPhone(value?: string | null) {
  const digits = value ? value.replace(/\D/g, "") : "";
  if (!digits) return { code: "506", number: "" };
  if (digits.length <= 8) return { code: "506", number: digits };
  return {
    code: digits.slice(0, digits.length - 8),
    number: digits.slice(-8),
  };
}

export function ClienteForm({ onSubmit, onCancel, initialData }: ClienteFormProps) {
  const phoneDefaults = splitPhone(initialData?.telefono ?? "");
  const { register, handleSubmit, formState, getValues } = useForm<ClienteFormData>({
    defaultValues: initialData
      ? {
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        cedula: initialData.cedula ?? "",
        email: initialData.email,
        telefonoCodigo: phoneDefaults.code,
        telefonoNumero: phoneDefaults.number,
        contactoEmergencia: initialData.contactoEmergencia ?? "",
        observaciones: initialData.observaciones ?? "",
      }
      : {
        nombre: "",
        apellido: "",
        cedula: "",
        email: "",
        telefonoCodigo: "506",
        telefonoNumero: "",
        contactoEmergencia: "",
        observaciones: "",
      },
  });

  const { errors } = formState;
  const telefonoError = errors.telefonoCodigo?.message || errors.telefonoNumero?.message;

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
            placeholder="Perez"
            className="rounded-xl"
          />
          {errors.apellido && <p className="text-sm text-red-600">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cedula">Cedula *</Label>
          <Input
            id="cedula"
            inputMode="numeric"
            maxLength={9}
            {...register("cedula", {
              required: "La cedula es requerida",
              pattern: { value: /^\d{9}$/, message: "La cedula debe tener 9 digitos" },
              setValueAs: (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
            })}
            placeholder="102030405"
            className="rounded-xl"
          />
          {errors.cedula && <p className="text-sm text-red-600">{errors.cedula.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electronico *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "El correo es requerido",
              setValueAs: (value) => (typeof value === "string" ? value.trim() : value),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Correo invalido",
              },
            })}
            placeholder="juan@ejemplo.com"
            className="rounded-xl"
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefonoNumero">Telefono *</Label>
        <div className="flex gap-2">
          <Input
            id="telefonoCodigo"
            inputMode="numeric"
            maxLength={4}
            {...register("telefonoCodigo", {
              required: "El codigo es requerido",
              pattern: { value: /^\d{1,4}$/, message: "Codigo invalido" },
              setValueAs: (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
            })}
            placeholder="506"
            className="w-24 rounded-xl"
          />
          <Input
            id="telefonoNumero"
            inputMode="numeric"
            maxLength={12}
            {...register("telefonoNumero", {
              required: "El telefono es requerido",
              pattern: { value: /^\d{7,10}$/, message: "Telefono invalido" },
              setValueAs: (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
              validate: () => {
                const codigo = getValues("telefonoCodigo").replace(/\D/g, "");
                const numero = getValues("telefonoNumero").replace(/\D/g, "");
                const total = `${codigo}${numero}`.length;
                if (total < 8 || total > 15) return "Telefono invalido";
                return true;
              },
            })}
            placeholder="88888888"
            className="flex-1 rounded-xl"
          />
        </div>
        {telefonoError && <p className="text-sm text-red-600">{telefonoError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactoEmergencia">Contacto de Emergencia (opcional)</Label>
        <Input
          id="contactoEmergencia"
          {...register("contactoEmergencia")}
          placeholder="Nombre y telefono: Maria Perez - 8888 8888"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
        <Textarea
          id="observaciones"
          {...register("observaciones")}
          placeholder="Notas adicionales, condiciones medicas, objetivos, etc."
          className="min-h-[100px] rounded-xl"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="rounded-xl text-white shadow-lg" style={{ background: getPrimaryGradient() }}>
          {initialData ? "Actualizar Cliente" : "Registrar Cliente"}
        </Button>
      </div>
    </form>
  );
}
