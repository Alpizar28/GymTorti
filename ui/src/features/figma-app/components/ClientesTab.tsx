"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClienteForm } from "./ClienteForm";
import type { Cliente, ClienteFormData } from "../types";
import { getPrimaryGradient, themeColors } from "@/config/app.config";

interface ClientesTabProps {
  clientes: Cliente[];
  allClientes: Cliente[];
  onCreateCliente: (cliente: ClienteFormData) => void | Promise<void>;
  onUpdateCliente: (clienteId: string, cliente: ClienteFormData) => void | Promise<void>;
  onDeleteCliente: (clienteId: string) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}

export function ClientesTab({
  clientes,
  allClientes,
  onCreateCliente,
  onUpdateCliente,
  onDeleteCliente,
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

  const handleEnviarRecordatorio = (clienteId: string) => {
    const cliente = allClientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    const phone = normalizePhone(cliente.telefono);
    if (!phone) {
      alert("El cliente no tiene telefono valido registrado.");
      return;
    }
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido ?? ""}`.trim();
    const hasVencimiento = Boolean(cliente.fechaVencimiento);
    const vencimiento = hasVencimiento ? new Date(cliente.fechaVencimiento!).toLocaleDateString("es-CR") : "";
    let message = "";
    switch (cliente.estado) {
      case "vencido":
        message = hasVencimiento
          ? `Hola ${nombreCompleto}, tu membresia vencio el ${vencimiento}. Si deseas renovarla, escribinos.`
          : `Hola ${nombreCompleto}, tu membresia esta vencida. Si deseas renovarla, escribinos.`;
        break;
      case "por-vencer":
        message = hasVencimiento
          ? `Hola ${nombreCompleto}, tu membresia vence el ${vencimiento}. Si deseas renovarla, escribinos.`
          : `Hola ${nombreCompleto}, tu membresia esta por vencer. Si deseas renovarla, escribinos.`;
        break;
      case "activo":
        if (hasVencimiento) {
          const hoy = new Date();
          const diasRestantes = Math.max(
            0,
            Math.ceil((new Date(cliente.fechaVencimiento!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          );
          const diasLabel = diasRestantes === 1 ? "dia" : "dias";
          message = `Hola ${nombreCompleto}, te quedan ${diasRestantes} ${diasLabel} de membresia. Vence el ${vencimiento}. Si quieres renovarla con tiempo, escribinos.`;
        } else {
          message = `Hola ${nombreCompleto}, tu membresia esta activa. Si quieres actualizar la fecha de vencimiento, escribinos.`;
        }
        break;
      case "inactivo":
      default:
        message = hasVencimiento
          ? `Hola ${nombreCompleto}, tu membresia no esta activa y su ultima fecha fue ${vencimiento}. Si deseas reactivarla, escribinos.`
          : `Hola ${nombreCompleto}, no tenemos una membresia activa registrada. Si deseas activarla, escribinos.`;
        break;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
      <Card className="overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
        <CardHeader className="border-b border-border bg-surface-hover">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="font-black text-foreground" style={{ fontSize: "1.5rem" }}>
                Gestión de Clientes
              </CardTitle>
              <p className="mt-1 text-sm text-muted">Administra la información de tus miembros</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <Button
                  variant={filter === "todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("todos")}
                  className="rounded-xl"
                  style={filter === "todos" ? { background: getPrimaryGradient(), color: 'white' } : {}}
                >
                  Todos ({clientes.length})
                </Button>
                <Button
                  variant={filter === "activos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("activos")}
                  className="rounded-xl"
                  style={filter === "activos" ? { background: getPrimaryGradient(), color: 'white' } : {}}
                >
                  Activos ({clientes.filter((c) => c.estado === "activo").length})
                </Button>
                <Button
                  variant={filter === "por-vencer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("por-vencer")}
                  className="rounded-xl"
                  style={filter === "por-vencer" ? { background: getPrimaryGradient(), color: 'white' } : {}}
                >
                  Por vencer ({clientes.filter((c) => c.estado === "por-vencer").length})
                </Button>
                <Button
                  variant={filter === "vencidos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("vencidos")}
                  className="rounded-xl"
                  style={filter === "vencidos" ? { background: getPrimaryGradient(), color: 'white' } : {}}
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
                  <Button className="rounded-xl text-white shadow-lg transition-all hover:shadow-xl" style={{ background: getPrimaryGradient() }}>
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
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: getPrimaryGradient() }}>
                <UsersIcon />
              </div>
              <p className="text-lg text-muted">
                {clientes.length === 0 ? "No hay clientes registrados. Agrega el primer cliente." : "No hay clientes en este filtro."}
              </p>
            </div>
          ) : (
            <Table
              containerClassName="overflow-x-visible"
              className="[&_td]:px-[15px] [&_td]:py-[11px] [&_th]:px-[15px] [&_th]:h-[39px]"
            >
              <TableHeader>
                <TableRow className="bg-surface-hover hover:bg-surface-hover border-border">
                  <TableHead className="rounded-tl-3xl text-muted">Cliente</TableHead>
                  <TableHead className="text-muted">Contacto</TableHead>
                  <TableHead className="text-muted">Membresía</TableHead>
                  <TableHead className="text-muted">Estado</TableHead>
                  <TableHead className="rounded-tr-3xl text-right text-muted">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className="transition-colors hover:bg-surface-hover border-border">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {cliente.nombre} {cliente.apellido}
                        </p>
                        <p className="text-sm text-muted">ID: {cliente.id}</p>
                        <p className="text-sm text-muted">Cedula: {cliente.cedula || "--"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{cliente.email}</p>
                        <p className="text-sm text-muted">{cliente.telefono}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="capitalize text-foreground border-border">
                          {cliente.tipoMembresia}
                        </Badge>
                        <p className="text-sm text-muted">
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
                          className="group relative rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700"
                          aria-label="Enviar por WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1" style={{ background: getPrimaryGradient() }}>
                            Enviar recordatorio
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(cliente)}
                          className="group relative rounded-xl hover:bg-surface-hover"
                          style={{ color: themeColors.primary.solid() }}
                          aria-label="Editar cliente"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1" style={{ background: getPrimaryGradient() }}>
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
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1" style={{ background: getPrimaryGradient() }}>
                            Eliminar cliente
                          </span>
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
