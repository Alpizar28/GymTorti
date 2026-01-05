"use client";

import { useState } from "react";
import { ChevronDown, Download, Eye, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDownload } from "@/lib/api";
import { MedicionDetail } from "./MedicionDetail";
import { MedicionForm } from "./MedicionForm";
import { MedicionesReporteDialog } from "./MedicionesReporteDialog";
import type { Cliente, Medicion } from "../types";

interface MedicionesTabProps {
  mediciones: Medicion[];
  clientes: Cliente[];
  onCreateMedicion: (medicion: Omit<Medicion, "id">) => void | Promise<void>;
  onDeleteMedicion: (id: string) => void | Promise<void>;
}

export function MedicionesTab({ mediciones, clientes, onCreateMedicion, onDeleteMedicion }: MedicionesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMedicion, setSelectedMedicion] = useState<Medicion | null>(null);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [reporteCliente, setReporteCliente] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleAddMedicion = async (medicion: Omit<Medicion, "id">) => {
    await onCreateMedicion(medicion);
    setDialogOpen(false);
  };

  const handleDeleteMedicion = async (id: string) => {
    if (confirm("Estas seguro de eliminar esta medicion?")) {
      await onDeleteMedicion(id);
    }
  };

  const handleViewDetail = (medicion: Medicion) => {
    setSelectedMedicion(medicion);
    setDetailDialogOpen(true);
  };

  const handleOpenReporte = (cliente: Cliente) => {
    setReporteCliente(cliente);
    setReporteDialogOpen(true);
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredClientes = normalizedQuery
    ? clientes.filter((cliente) => {
        const nombre = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        return nombre.includes(normalizedQuery) || cliente.email?.toLowerCase().includes(normalizedQuery) || cliente.telefono?.includes(normalizedQuery);
      })
    : clientes;

  const groupedMediciones = filteredClientes
    .map((cliente) => ({
      cliente,
      mediciones: mediciones
        .filter((m) => m.clienteId === cliente.id)
        .slice()
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    }))
    .filter((group) => group.mediciones.length > 0);

  const isExpanded = (clienteId: string) => expanded[clienteId] ?? false;

  const toggleExpanded = (clienteId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [clienteId]: !(prev[clienteId] ?? false),
    }));
  };

  const handleDownloadClienteReport = async (clienteId: string) => {
    try {
      const cliente = clientes.find((c) => c.id === clienteId);
      const rawName = cliente ? `${cliente.nombre} ${cliente.apellido}`.trim() : "cliente";
      const safeName = rawName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "cliente";
      const blob = await apiDownload(`/api/measurements/report/pdf?clientId=${Number(clienteId)}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediciones_${safeName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el PDF.");
    }
  };

  const handleShareReportWhatsApp = async (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    const phone = normalizePhone(cliente.telefono);
    if (!phone) {
      alert("El cliente no tiene telefono valido registrado.");
      return;
    }
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido ?? ""}`.trim();
    const message = `Hola ${nombreCompleto}, te comparto tu reporte de mediciones. Te adjunto el PDF por aqui.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const waWindow = window.open(url, "_blank", "noopener,noreferrer");
    try {
      await handleDownloadClienteReport(clienteId);
      if (waWindow) waWindow.focus();
    } catch (err) {
      console.error(err);
      alert("No se pudo preparar el reporte para WhatsApp.");
    }
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
                <MedicionForm onSubmit={handleAddMedicion} onCancel={() => setDialogOpen(false)} clientes={clientes} mediciones={mediciones} />
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
            <div className="space-y-6 p-6">
              <div className="max-w-md">
                <Input
                  placeholder="Buscar cliente por nombre, correo o telefono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-none bg-white shadow-sm"
                />
              </div>
              {groupedMediciones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                  No hay mediciones para el filtro seleccionado.
                </div>
              ) : (
                groupedMediciones.map((group) => {
                  const latest = group.mediciones[0];
                  const latestImc = latest ? parseFloat(calcularIMC(latest.peso, latest.altura)) : 0;
                  const opened = isExpanded(group.cliente.id);
                  return (
                    <div key={group.cliente.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {group.cliente.nombre} {group.cliente.apellido}
                          </p>
                          {latest && (
                            <p className="mt-1 text-xs text-gray-500">Ultima medicion: {new Date(latest.fecha).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {latest && (
                            <div className="hidden items-center gap-3 rounded-full bg-[#fff4f0] px-3 py-1 text-xs font-semibold text-gray-700 md:flex">
                              <span>Peso: {latest.peso} kg</span>
                              <span>IMC: {latestImc}</span>
                            </div>
                          )}
                          <div className="rounded-full bg-[#ffe5e6] px-3 py-1 text-sm font-semibold text-[#ff5e62]">
                            {group.mediciones.length} medicion{group.mediciones.length !== 1 ? "es" : ""}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReporte(group.cliente)}
                            className="rounded-xl text-[#ff5e62] hover:bg-[#ffe5e6] hover:text-[#ff5e62]"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadClienteReport(group.cliente.id)}
                            className="rounded-xl text-[#ff5e62] hover:bg-[#ffe5e6] hover:text-[#ff5e62]"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareReportWhatsApp(group.cliente.id)}
                            className="rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700"
                            aria-label="Enviar por WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(group.cliente.id)}
                            className="rounded-xl text-gray-500 hover:bg-gray-100"
                          >
                            <ChevronDown className={`h-4 w-4 transition ${opened ? "rotate-180" : ""}`} />
                          </Button>
                        </div>
                      </div>
                      {opened && (
                        <div className="mt-4 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="rounded-tl-3xl">Fecha</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead>% Grasa</TableHead>
                                <TableHead>IMC</TableHead>
                                <TableHead className="rounded-tr-3xl text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.mediciones.map((medicion) => {
                                const imc = parseFloat(calcularIMC(medicion.peso, medicion.altura));
                                return (
                                  <TableRow key={medicion.id} className="transition-colors hover:bg-gray-50">
                                    <TableCell>
                                      <div className="text-sm text-gray-900">{new Date(medicion.fecha).toLocaleDateString()}</div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold text-gray-900">{medicion.peso} kg</span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold text-gray-900">{medicion.grasaCorporal ?? "-"} %</span>
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
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalle de Medición</DialogTitle>
            <DialogDescription>Mediciones completas del cliente</DialogDescription>
          </DialogHeader>
          {selectedMedicion && <MedicionDetail medicion={selectedMedicion} clienteNombre={getClienteNombre(selectedMedicion.clienteId)} />}
        </DialogContent>
      </Dialog>


      {reporteCliente && (
        <MedicionesReporteDialog
          cliente={reporteCliente}
          open={reporteDialogOpen}
          onOpenChange={setReporteDialogOpen}
          mediciones={mediciones.filter((m) => m.clienteId === reporteCliente.id)}
        />
      )}
    </>
  );
}

function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (!digits) return null;
  digits = digits.replace(/^0+/, "");
  if (digits.length === 8) {
    digits = `506${digits}`;
  }
  if (digits.length < 8) return null;
  return digits;
}
