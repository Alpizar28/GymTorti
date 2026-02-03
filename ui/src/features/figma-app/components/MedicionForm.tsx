"use client";

import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPrimaryGradient, themeColors } from "@/config/app.config";
import type { Cliente, Medicion } from "../types";
import { AlertCircle, Calendar, Scale, Ruler, User, Info, Check } from "lucide-react";

interface MedicionFormProps {
  onSubmit: (data: Omit<Medicion, "id">) => void;
  onCancel: () => void;
  clientes: Cliente[];
  mediciones: Medicion[];
}

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-1 border border-red-100">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export function MedicionForm({ onSubmit, onCancel, clientes, mediciones }: MedicionFormProps) {
  const { register, handleSubmit, setValue, control, formState } = useForm<Omit<Medicion, "id">>({
    defaultValues: {
      clienteId: "",
      fecha: new Date().toISOString().split("T")[0],
      peso: 0,
      altura: 0,
      pechoCm: 0,
      cinturaCm: 0,
      caderaCm: 0,
      brazoIzqCm: 0,
      brazoDerCm: 0,
      piernaIzqCm: 0,
      piernaDerCm: 0,
      grasaCorporal: undefined,
    },
  });

  const clienteId = useWatch({ control, name: "clienteId" });
  const prefilledForRef = useRef<string | null>(null);
  const { errors } = formState;

  useEffect(() => {
    if (!clienteId || prefilledForRef.current === clienteId) return;
    const latest = mediciones
      .filter((m) => m.clienteId === clienteId)
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    if (!latest) {
      prefilledForRef.current = clienteId;
      return;
    }

    setValue("peso", latest.peso);
    setValue("altura", latest.altura);
    setValue("pechoCm", latest.pechoCm);
    setValue("cinturaCm", latest.cinturaCm);
    setValue("caderaCm", latest.caderaCm);
    setValue("brazoIzqCm", latest.brazoIzqCm);
    setValue("brazoDerCm", latest.brazoDerCm);
    setValue("piernaIzqCm", latest.piernaIzqCm);
    setValue("piernaDerCm", latest.piernaDerCm);
    setValue("grasaCorporal", latest.grasaCorporal ?? undefined);
    prefilledForRef.current = clienteId;
  }, [clienteId, mediciones, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      {/* Selección de Cliente y Fecha */}
      <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="clienteId" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-primary" />
              Cliente
            </Label>
            <Select value={clienteId} onValueChange={(value) => setValue("clienteId", value)}>
              <SelectTrigger className="rounded-xl h-11 border-gray-200 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Selecciona al atleta..." />
              </SelectTrigger>
              <SelectContent>
                {clientes
                  .filter((c) => c.estado === "activo")
                  .map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <ErrorMessage message={errors.clienteId ? "¡Ups! Necesitamos saber de quién son estas medidas 🤔" : undefined} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-primary" />
              Fecha de Registro
            </Label>
            <Input
              id="fecha"
              type="date"
              {...register("fecha", { required: "¡La fecha es clave para ver el progreso! 📅" })}
              className="rounded-xl h-11 border-gray-200"
            />
            <ErrorMessage message={errors.fecha?.message} />
          </div>
        </CardContent>
      </Card>

      {/* Datos Básicos */}
      <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Composición Corporal</h4>
            <p className="text-sm text-gray-500">Métricas principales de progreso</p>
          </div>
        </div>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              {...register("peso", {
                required: "Este dato es fundamental ⚖️",
                min: { value: 1, message: "¿Seguro? Debe ser un peso real 😉" }
              })}
              placeholder="Ej: 70.5"
              className="rounded-xl bg-gray-50/30"
            />
            <ErrorMessage message={errors.peso?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="altura">Altura (cm)</Label>
            <Input
              id="altura"
              type="number"
              step="0.1"
              {...register("altura", {
                required: "Necesitamos la altura 📏",
                min: { value: 1, message: "La altura debe ser válida" }
              })}
              placeholder="Ej: 175"
              className="rounded-xl bg-gray-50/30"
            />
            <ErrorMessage message={errors.altura?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grasaCorporal" className="flex items-center gap-1">
              % Grasa
              <span className="text-xs text-muted-foreground ml-1">(Opcional)</span>
            </Label>
            <Input
              id="grasaCorporal"
              type="number"
              step="0.1"
              {...register("grasaCorporal", {
                min: { value: 0, message: "No puede ser negativo" },
                max: { value: 100, message: "No puede ser más de 100%" }
              })}
              placeholder="Ej: 15.5"
              className="rounded-xl bg-gray-50/30"
            />
            <ErrorMessage message={errors.grasaCorporal?.message} />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Medidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Torso */}
        <Card className="rounded-2xl shadow-sm border-gray-100">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
            <Ruler className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900">Torso</h4>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pechoCm">Pecho</Label>
                <div className="relative">
                  <Input id="pechoCm" type="number" step="0.1" {...register("pechoCm", { required: "Dato requerido" })} placeholder="0" className="rounded-xl pr-8" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">cm</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cinturaCm">Cintura</Label>
                <div className="relative">
                  <Input id="cinturaCm" type="number" step="0.1" {...register("cinturaCm", { required: "Dato requerido" })} placeholder="0" className="rounded-xl pr-8" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">cm</span>
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="caderaCm">Cadera</Label>
                <div className="relative">
                  <Input id="caderaCm" type="number" step="0.1" {...register("caderaCm", { required: "Dato requerido" })} placeholder="0" className="rounded-xl pr-8" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">cm</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Brazos */}
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <h4 className="font-semibold text-gray-900">Brazos</h4>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brazoIzqCm">Izquierdo</Label>
                <Input id="brazoIzqCm" type="number" step="0.1" {...register("brazoIzqCm", { required: "Requerido" })} placeholder="0" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brazoDerCm">Derecho</Label>
                <Input id="brazoDerCm" type="number" step="0.1" {...register("brazoDerCm", { required: "Requerido" })} placeholder="0" className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Piernas */}
          <Card className="rounded-2xl shadow-sm border-gray-100">
            <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <h4 className="font-semibold text-gray-900">Piernas</h4>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="piernaIzqCm">Izquierda</Label>
                <Input id="piernaIzqCm" type="number" step="0.1" {...register("piernaIzqCm", { required: "Requerido" })} placeholder="0" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="piernaDerCm">Derecha</Label>
                <Input id="piernaDerCm" type="number" step="0.1" {...register("piernaDerCm", { required: "Requerido" })} placeholder="0" className="rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 pb-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl hover:bg-gray-100 text-gray-600 font-medium px-6"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          style={{ background: getPrimaryGradient() }}
        >
          {formState.isSubmitting ? (
            "Guardando..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Guardar Progreso
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
