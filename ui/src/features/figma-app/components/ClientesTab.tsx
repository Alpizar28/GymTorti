"use client";

import { useMemo, useState } from "react";
import { Bell, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClienteForm } from "./ClienteForm";
import type { Cliente, ClienteFormData } from "../types";

interface ClientesTabProps {
  clientes: Cliente[];
  allClientes: Cliente[];
  onCreateCliente: (cliente: ClienteFormData) => void | Promise<void>;
  onUpdateCliente: (clienteId: string, cliente: ClienteFormData) => void | Promise<void>;
  onDeleteCliente: (clienteId: string) => void | Promise<void>;
  onSendReminder: (clienteId: string) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}

export function ClientesTab({
  clientes,
  allClientes,
  onCreateCliente,
  onUpdateCliente,
  onDeleteCliente,
  onSendReminder,
  onRefresh,
}: ClientesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [filter, setFilter] = useState<"todos" | "activos" | "vencidos" | "por-vencer">("todos");

  const handleAddCliente = async (cliente: ClienteFormData) => {
    await onCreateCliente(cliente);
    setDialogOpen(false);
  };

  const handleEditCliente = async (cliente: ClienteFormData) => {
    if (!editingCliente) return;
    await onUpdateCliente(editingCliente.id, cliente);
    setEditingCliente(null);
    setDialogOpen(false);
  };

  const handleDeleteCliente = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) {
      await onDeleteCliente(id);
    }
  };

  const handleEnviarRecordatorio = async (clienteId: string) => {
    const cliente = allClientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    try {
      await onSendReminder(clienteId);
      alert(`Recordatorio enviado a ${cliente.nombre} ${cliente.apellido}\nTeléfono: ${cliente.telefono}\nCorreo: ${cliente.email}`);
    } catch {
      // Error is surfaced by the global error banner.
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const getEstadoBadge = (estado: Cliente["estado"], fechaVencimiento: string) => {
    if (!fechaVencimiento) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    switch (estado) {
      case "activo":
        return <Badge className="border-none bg-green-500 text-white hover:bg-green-600">Activo</Badge>;
      case "por-vencer":
        return <Badge className="border-none bg-yellow-500 text-white hover:bg-yellow-600">Por vencer ({diasParaVencer}d)</Badge>;
      case "vencido":
        return <Badge className="border-none bg-red-500 text-white hover:bg-red-600">Vencido</Badge>;
      case "inactivo":
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (filter === "activos") return c.estado === "activo";
      if (filter === "vencidos") return c.estado === "vencido";
      if (filter === "por-vencer") return c.estado === "por-vencer";
      return true;
    });
  }, [clientes, filter]);

  return (
    <>
      <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="font-black text-gray-900" style={{ fontSize: "1.5rem" }}>
                Gestión de Clientes
              </CardTitle>
              <p className="mt-1 text-sm text-gray-600">Administra la información de tus miembros</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <Button
                  variant={filter === "todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("todos")}
                  className={filter === "todos" ? "rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white" : "rounded-xl"}
                >
                  Todos ({clientes.length})
                </Button>
                <Button
                  variant={filter === "activos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("activos")}
                  className={filter === "activos" ? "rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white" : "rounded-xl"}
                >
                  Activos ({clientes.filter((c) => c.estado === "activo").length})
                </Button>
                <Button
                  variant={filter === "por-vencer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("por-vencer")}
                  className={filter === "por-vencer" ? "rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white" : "rounded-xl"}
                >
                  Por vencer ({clientes.filter((c) => c.estado === "por-vencer").length})
                </Button>
                <Button
                  variant={filter === "vencidos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("vencidos")}
                  className={filter === "vencidos" ? "rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white" : "rounded-xl"}
                >
                  Vencidos ({clientes.filter((c) => c.estado === "vencido").length})
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refrescar
              </Button>

              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) setEditingCliente(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg transition-all hover:shadow-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-black" style={{ fontSize: "1.5rem" }}>
                      {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCliente ? "Modifica la información del cliente" : "Agrega un nuevo miembro al gimnasio"}
                    </DialogDescription>
                  </DialogHeader>
                  <ClienteForm
                    onSubmit={editingCliente ? handleEditCliente : handleAddCliente}
                    onCancel={() => setDialogOpen(false)}
                    initialData={editingCliente || undefined}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966]">
                <UsersIcon />
              </div>
              <p className="text-lg text-gray-500">
                {clientes.length === 0 ? "No hay clientes registrados. Agrega el primer cliente." : "No hay clientes en este filtro."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Membresía</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="rounded-tr-3xl text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} className="transition-colors hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          <p className="text-sm text-gray-600">ID: {cliente.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">{cliente.email}</p>
                          <p className="text-sm text-gray-600">{cliente.telefono}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="capitalize">
                            {cliente.tipoMembresia}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            Vence:{" "}
                            {cliente.fechaVencimiento ? new Date(cliente.fechaVencimiento).toLocaleDateString("es-CR") : "Sin membresia"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(cliente.estado, cliente.fechaVencimiento)}</TableCell>
                      <TableCell className="text-right overflow-visible">
                        <div className="flex justify-end gap-2 overflow-visible">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnviarRecordatorio(cliente.id)}
                            className="group relative rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            aria-label="Enviar recordatorio"
                          >
                            <Bell className="h-4 w-4" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1">
                              Enviar recordatorio
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(cliente)}
                            className="group relative rounded-xl text-[#ff5e62] hover:bg-[#ffe5e6] hover:text-[#ff5e62]"
                            aria-label="Editar cliente"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1">
                              Editar cliente
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCliente(cliente.id)}
                            className="group relative rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1">
                              Eliminar cliente
                            </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
