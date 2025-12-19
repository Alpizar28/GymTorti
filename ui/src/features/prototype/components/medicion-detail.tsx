"use client";

import { Badge } from "@/components/ui/badge";
import type { Medicion } from "@/features/prototype/types";

type Props = {
  medicion: Medicion;
  clienteNombre: string;
};

export function MedicionDetail({ medicion, clienteNombre }: Props) {
  const alturaMetros = medicion.altura / 100;
  const imc = alturaMetros > 0 ? Number((medicion.peso / (alturaMetros * alturaMetros)).toFixed(1)) : 0;

  const categoria =
    imc < 18.5
      ? { texto: "Bajo peso", color: "bg-blue-100 text-blue-900" }
      : imc < 25
        ? { texto: "Normal", color: "bg-green-100 text-green-900" }
        : imc < 30
          ? { texto: "Sobrepeso", color: "bg-yellow-100 text-yellow-900" }
          : { texto: "Obesidad", color: "bg-red-100 text-red-900" };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="text-lg font-bold text-gray-900">{clienteNombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="text-lg font-bold text-gray-900">{new Date(medicion.fecha).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-gray-50 p-6">
        <h3 className="font-semibold text-gray-900">Datos Básicos</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-gray-600">Peso</p>
            <p className="text-2xl font-bold text-[#ff5e62]">{medicion.peso}</p>
            <p className="text-xs text-gray-500">kg</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-gray-600">Altura</p>
            <p className="text-2xl font-bold text-[#ff9966]">{medicion.altura}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-gray-600">IMC</p>
            <p className="text-2xl font-bold text-gray-900">{imc}</p>
            <Badge className={`${categoria.color} mt-1 text-xs`}>{categoria.texto}</Badge>
          </div>
          {typeof medicion.grasaCorporal === "number" && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs text-gray-600">Grasa</p>
              <p className="text-2xl font-bold text-purple-600">{medicion.grasaCorporal}</p>
              <p className="text-xs text-gray-500">%</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-gray-50 p-6">
        <h3 className="font-semibold text-gray-900">Circunferencias Torso</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Pecho", medicion.pechoCm],
            ["Cintura", medicion.cinturaCm],
            ["Cadera", medicion.caderaCm],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="mb-2 text-xs text-gray-600">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">cm</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-gray-50 p-6">
        <h3 className="font-semibold text-gray-900">Circunferencias Brazos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["Brazo Izquierdo", medicion.brazoIzqCm],
            ["Brazo Derecho", medicion.brazoDerCm],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="mb-2 text-xs text-gray-600">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">cm</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-gray-50 p-6">
        <h3 className="font-semibold text-gray-900">Circunferencias Piernas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["Pierna Izquierda", medicion.piernaIzqCm],
            ["Pierna Derecha", medicion.piernaDerCm],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 text-center shadow-sm">
              <p className="mb-2 text-xs text-gray-600">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">cm</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

