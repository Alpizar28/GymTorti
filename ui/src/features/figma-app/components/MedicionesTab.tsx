"use client";

import { useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MedicionDetail } from "./MedicionDetail";
import { MedicionForm } from "./MedicionForm";
import type { Cliente, Medicion } from "../types";

interface MedicionesTabProps {
  mediciones: Medicion[];
  setMediciones: (mediciones: Medicion[]) => void;
  clientes: Cliente[];
}

export function MedicionesTab({ mediciones, setMediciones, clientes }: MedicionesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMedicion, setSelectedMedicion] = useState<Medicion | null>(null);

  const handleAddMedicion = (medicion: Omit<Medicion, "id">) => {
    const nuevaMedicion = { ...medicion, id: crypto.randomUUID() };
    setMediciones([...mediciones, nuevaMedicion]);
    setDialogOpen(false);
  };

  const handleDeleteMedicion = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta medición?")) {
      setMediciones(mediciones.filter((m) => m.id !== id));
    }
  };

  const handleViewDetail = (medicion: Medicion) => {
    setSelectedMedicion(medicion);
    setDetailDialogOpen(true);
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado";
  };

  const calcularIMC = (peso: number, altura: number) => {
    const alturaMetros = altura / 100;
    return (peso / (alturaMetros * alturaMetros)).toFixed(1);
  };

  const getIMCColor = (imc: number) => {
    if (imc < 18.5) return "text-blue-600";
    if (imc < 25) return "text-green-600";
    if (imc < 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl text-gray-900">Mediciones Corporales</CardTitle>
              <p className="mt-1 text-sm text-gray-600">Seguimiento del progreso físico</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={clientes.length === 0}
                  className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg transition-all hover:shadow-xl"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Medición
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Nueva Medición</DialogTitle>
                  <DialogDescription>Registra las medidas corporales del cliente</DialogDescription>
                </DialogHeader>
                <MedicionForm onSubmit={handleAddMedicion} onCancel={() => setDialogOpen(false)} clientes={clientes} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966]">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-gray-500">Primero debes agregar clientes para registrar mediciones.</p>
            </div>
          ) : mediciones.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966]">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-gray-500">No hay mediciones registradas. Registra la primera medición.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Altura</TableHead>
                    <TableHead>IMC</TableHead>
                    <TableHead className="rounded-tr-3xl text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mediciones
                    .slice()
                    .reverse()
                    .map((medicion) => {
                      const imc = parseFloat(calcularIMC(medicion.peso, medicion.altura));
                      return (
                        <TableRow key={medicion.id} className="transition-colors hover:bg-gray-50">
                          <TableCell>
                            <div className="font-semibold text-gray-900">{getClienteNombre(medicion.clienteId)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">{new Date(medicion.fecha).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">{medicion.peso} kg</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">{medicion.altura} cm</span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-lg font-bold ${getIMCColor(imc)}`}>{imc}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(medicion)}
                                className="rounded-xl text-[#ff5e62] hover:bg-[#ffe5e6] hover:text-[#ff5e62]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMedicion(medicion.id)}
                                className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalle de Medición</DialogTitle>
            <DialogDescription>Mediciones completas del cliente</DialogDescription>
          </DialogHeader>
          {selectedMedicion && <MedicionDetail medicion={selectedMedicion} clienteNombre={getClienteNombre(selectedMedicion.clienteId)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

