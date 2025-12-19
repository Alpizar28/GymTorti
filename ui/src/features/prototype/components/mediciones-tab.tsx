"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Plus, Trash2 } from "lucide-react";
import type { Cliente, Medicion } from "@/features/prototype/types";
import { MedicionDetail } from "@/features/prototype/components/medicion-detail";
import { MedicionForm } from "@/features/prototype/components/medicion-form";

type Props = {
  mediciones: Medicion[];
  setMediciones: (mediciones: Medicion[]) => void;
  clientes: Cliente[];
};

export function MedicionesTab({ mediciones, setMediciones, clientes }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMedicion, setSelectedMedicion] = useState<Medicion | null>(null);

  function handleAddMedicion(medicion: Omit<Medicion, "id">) {
    setMediciones([...mediciones, { ...medicion, id: crypto.randomUUID() }]);
    setDialogOpen(false);
  }

  function handleDeleteMedicion(id: string) {
    const ok = window.confirm("¿Estás seguro de eliminar esta medición?");
    if (!ok) return;
    setMediciones(mediciones.filter((m) => m.id !== id));
  }

  function handleViewDetail(medicion: Medicion) {
    setSelectedMedicion(medicion);
    setDetailDialogOpen(true);
  }

  function getClienteNombre(clienteId: string) {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado";
  }

  function calcularIMC(peso: number, altura: number) {
    const m = altura / 100;
    if (!m) return "0.0";
    return (peso / (m * m)).toFixed(1);
  }

  function getIMCColor(imc: number) {
    if (imc < 18.5) return "text-blue-600";
    if (imc < 25) return "text-green-600";
    if (imc < 30) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <>
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-gray-900">Mediciones Corporales</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Seguimiento del progreso físico</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={clientes.length === 0}
                  className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Medición
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
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
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">Primero debes agregar clientes para registrar mediciones.</p>
            </div>
          ) : mediciones.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">No hay mediciones registradas. Registra la primera medición.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Altura</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediciones
                  .slice()
                  .reverse()
                  .map((medicion) => {
                    const imc = Number(calcularIMC(medicion.peso, medicion.altura));
                    return (
                      <TableRow key={medicion.id} className="hover:bg-gray-50 transition-colors">
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
                          <span className={`font-bold text-lg ${getIMCColor(imc)}`}>{imc}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(medicion)}
                              className="text-[#ff5e62] hover:text-[#ff5e62] hover:bg-[#ffe5e6] rounded-xl"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMedicion(medicion.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
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

