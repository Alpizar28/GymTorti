"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageWithFallback } from "@/components/figma/image-with-fallback";
import { BarChart3, Bell, FileText, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { Cliente, Medicion, Pago } from "@/features/prototype/types";
import { ClienteDetailDialog } from "@/features/prototype/components/cliente-detail-dialog";
import { ClienteForm } from "@/features/prototype/components/cliente-form";
import { ClienteReporteDialog } from "@/features/prototype/components/cliente-reporte-dialog";

type Filter = "todos" | "activos" | "vencidos" | "por-vencer";

type Props = {
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  allClientes: Cliente[];
  pagos: Pago[];
  mediciones: Medicion[];
};

export function ClientesTab({ clientes, setClientes, allClientes, pagos, mediciones }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("todos");

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (filter === "activos") return c.estado === "activo";
      if (filter === "vencidos") return c.estado === "vencido";
      if (filter === "por-vencer") return c.estado === "por-vencer";
      return true;
    });
  }, [clientes, filter]);

  function handleAddCliente(cliente: Omit<Cliente, "id">) {
    setClientes([...allClientes, { ...cliente, id: crypto.randomUUID() }]);
    setDialogOpen(false);
  }

  function handleEditCliente(cliente: Omit<Cliente, "id">) {
    if (!editingCliente) return;
    setClientes(allClientes.map((c) => (c.id === editingCliente.id ? { ...cliente, id: editingCliente.id } : c)));
    setEditingCliente(null);
    setDialogOpen(false);
  }

  function handleDeleteCliente(id: string) {
    const ok = window.confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.");
    if (!ok) return;
    setClientes(allClientes.filter((c) => c.id !== id));
  }

  function handleRenovarMembresia(clienteId: string) {
    const cliente = allClientes.find((c) => c.id === clienteId);
    if (!cliente) return;

    const months = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 } as const;
    const today = new Date();
    const currentDue = new Date(cliente.fechaVencimiento);
    const base = currentDue > today ? currentDue : today;
    const next = new Date(base);
    next.setMonth(next.getMonth() + months[cliente.tipoMembresia]);

    setClientes(
      allClientes.map((c) =>
        c.id === clienteId ? { ...c, fechaVencimiento: next.toISOString().split("T")[0], estado: "activo" } : c,
      ),
    );
    window.alert("Membresía renovada exitosamente");
  }

  function handleEnviarRecordatorio(clienteId: string) {
    const cliente = allClientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    window.alert(
      `Recordatorio enviado a ${cliente.nombre} ${cliente.apellido}\nTeléfono: ${cliente.telefono}\nCorreo: ${cliente.email}`,
    );
  }

  function openEditDialog(cliente: Cliente) {
    setEditingCliente(cliente);
    setDialogOpen(true);
  }

  function openDetailDialog(cliente: Cliente) {
    setSelectedCliente(cliente);
    setDetailDialogOpen(true);
  }

  function openReporteDialog(cliente: Cliente) {
    setSelectedCliente(cliente);
    setReporteDialogOpen(true);
  }

  function closeDialog(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingCliente(null);
  }

  function estadoBadge(cliente: Cliente) {
    const due = new Date(cliente.fechaVencimiento);
    const today = new Date();
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (cliente.estado === "activo") return <Badge className="bg-green-500 text-white border-none">Activo</Badge>;
    if (cliente.estado === "por-vencer")
      return (
        <Badge className="bg-yellow-500 text-white border-none">
          Por vencer ({days}d)
        </Badge>
      );
    if (cliente.estado === "vencido") return <Badge className="bg-red-500 text-white border-none">Vencido</Badge>;
    return <Badge className="bg-gray-200 text-gray-900">Inactivo</Badge>;
  }

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "todos", label: "Todos" },
    { key: "activos", label: "Activos" },
    { key: "por-vencer", label: "Por vencer" },
    { key: "vencidos", label: "Vencidos" },
  ];

  return (
    <>
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900">Clientes</CardTitle>
              <p className="mt-1 text-sm text-gray-600">Gestión de miembros (modo prototipo sin backend)</p>
            </div>

            <Button
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
              onClick={() => {
                setEditingCliente(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Cliente
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  filter === f.key
                    ? "rounded-full bg-gradient-to-r from-[#ff5e62] to-[#ff9966] px-4 py-2 text-sm font-semibold text-white shadow"
                    : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-50"
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966]">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-gray-500">No hay clientes para mostrar.</p>
            </div>
          ) : (
            <Table containerClassName="overflow-hidden rounded-none">
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {cliente.foto ? (
                          <ImageWithFallback
                            src={cliente.foto}
                            alt={`${cliente.nombre} ${cliente.apellido}`}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] text-sm font-bold text-white">
                            {cliente.nombre[0]}
                            {cliente.apellido[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </div>
                          <div className="mt-1 flex gap-3">
                            <button
                              onClick={() => openDetailDialog(cliente)}
                              className="flex items-center gap-1 text-xs font-semibold text-[#ff5e62] hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              Ver Cliente
                            </button>
                            <button
                              onClick={() => openReporteDialog(cliente)}
                              className="flex items-center gap-1 text-xs font-semibold text-[#ff9966] hover:underline"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Reporte
                            </button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{cliente.telefono}</div>
                        <div className="text-gray-500">{cliente.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900 border-none font-semibold capitalize">
                        {cliente.tipoMembresia}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{estadoBadge(cliente)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(cliente.estado === "vencido" || cliente.estado === "por-vencer") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenovarMembresia(cliente.id)}
                            className="rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700"
                            title="Renovar membresía"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnviarRecordatorio(cliente.id)}
                          className="rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Enviar recordatorio"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(cliente)}
                          className="rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCliente(cliente.id)}
                          className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingCliente ? "Actualiza la información del cliente" : "Agrega un nuevo cliente al sistema"}
            </DialogDescription>
          </DialogHeader>
          <ClienteForm
            initialData={editingCliente ?? undefined}
            onSubmit={(data) => (editingCliente ? handleEditCliente(data) : handleAddCliente(data))}
            onCancel={() => closeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedCliente && (
        <>
          <ClienteDetailDialog cliente={selectedCliente} open={detailDialogOpen} onOpenChange={setDetailDialogOpen} />
          <ClienteReporteDialog
            cliente={selectedCliente}
            open={reporteDialogOpen}
            onOpenChange={setReporteDialogOpen}
            pagos={pagos.filter((p) => p.clienteId === selectedCliente.id)}
            mediciones={mediciones.filter((m) => m.clienteId === selectedCliente.id)}
          />
        </>
      )}
    </>
  );
}

