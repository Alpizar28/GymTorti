"use client";

import { Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Cliente, Medicion } from "../types";

interface MedicionesReporteDialogProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediciones: Medicion[];
}

export function MedicionesReporteDialog({ cliente, open, onOpenChange, mediciones }: MedicionesReporteDialogProps) {
  const dataPeso = mediciones
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => ({
      fecha: new Date(m.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      peso: m.peso,
    }));

  const dataGrasa = mediciones
    .filter((m) => m.grasaCorporal != null)
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((m) => ({
      fecha: new Date(m.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      grasa: m.grasaCorporal as number,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-black" style={{ fontSize: "1.5rem" }}>
                Reporte de Mediciones
              </DialogTitle>
              <DialogDescription>Resumen de mediciones del cliente</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-gray-900">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <p className="mt-1 text-sm text-gray-700">ID: {cliente.id}</p>
              </div>
              <Badge className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white">
                {mediciones.length} medicion{mediciones.length !== 1 ? "es" : ""}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-[#ff5e62]" />
                  Evolucion de Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataPeso.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">No hay mediciones registradas</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dataPeso}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ background: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Line type="monotone" dataKey="peso" stroke="#ff5e62" strokeWidth={3} dot={{ fill: "#ff5e62", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-[#ff9966]" />
                  % Grasa Corporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataGrasa.length < 2 ? (
                  <p className="py-4 text-center text-gray-500">No hay suficientes datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dataGrasa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ background: "white", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Line type="monotone" dataKey="grasa" stroke="#ff9966" strokeWidth={3} dot={{ fill: "#ff9966", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-[#ff5e62]" />
                Historial de Mediciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mediciones.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No hay mediciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {mediciones
                    .slice()
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((medicion) => (
                      <div key={medicion.id} className="rounded-xl bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{new Date(medicion.fecha).toLocaleDateString("es-CR")}</p>
                          <div className="text-xs text-gray-600">
                            Peso: {medicion.peso} kg • Altura: {medicion.altura} cm • Grasa: {medicion.grasaCorporal ?? "-"} %
                          </div>
                        </div>
                        {medicion.notas && <p className="mt-2 text-xs text-gray-600">Notas: {medicion.notas}</p>}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
