"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, FileText, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import type { ClientCreateRequest, ClientResponse, ClientStatus, ClientUpdateRequest, Page } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_CREATE: ClientCreateRequest = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  notas: "",
};

function friendlyError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

function normalize(text?: string | null) {
  return text ?? "";
}

function estadoBadge(status: ClientStatus) {
  switch (status) {
    case "ACTIVO":
      return <Badge className="bg-green-500 text-white border-none hover:bg-green-600">Activo</Badge>;
    case "MOROSO":
      return <Badge className="bg-red-500 text-white border-none hover:bg-red-600">Moroso</Badge>;
    case "INACTIVO":
      return <Badge variant="secondary">Inactivo</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type Filter = "todos" | "activos" | "morosos" | "inactivos";

export function ClientesTabBackend({ searchQuery }: { searchQuery: string }) {
  const [clientes, setClientes] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClientResponse | null>(null);
  const [createForm, setCreateForm] = useState<ClientCreateRequest>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<ClientUpdateRequest>({});

  const query = useMemo(() => {
    const q = searchQuery.trim();
    const base = `/api/clients?page=0&size=200&sort=fechaRegistro,desc`;
    return q ? `${base}&search=${encodeURIComponent(q)}` : base;
  }, [searchQuery]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Page<ClientResponse>>(query);
      setClientes(data.content);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const clientesFiltrados = useMemo(() => {
    if (filter === "activos") return clientes.filter((c) => c.estado === "ACTIVO");
    if (filter === "morosos") return clientes.filter((c) => c.estado === "MOROSO");
    if (filter === "inactivos") return clientes.filter((c) => c.estado === "INACTIVO");
    return clientes;
  }, [clientes, filter]);

  function openCreate() {
    setEditingCliente(null);
    setEditForm({});
    setCreateForm(EMPTY_CREATE);
    setDialogOpen(true);
  }

  function openEdit(cliente: ClientResponse) {
    setEditingCliente(cliente);
    setEditForm({
      nombre: cliente.nombre,
      apellido: normalize(cliente.apellido),
      telefono: normalize(cliente.telefono),
      email: normalize(cliente.email),
      notas: normalize(cliente.notas),
      estado: cliente.estado,
    });
    setDialogOpen(true);
  }

  async function handleSubmitCreate() {
    if (!createForm.nombre.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    setError(null);
    try {
      await apiSend("/api/clients", "POST", {
        ...createForm,
        nombre: createForm.nombre.trim(),
        apellido: createForm.apellido?.trim() || undefined,
        telefono: createForm.telefono?.trim() || undefined,
        email: createForm.email?.trim() || undefined,
        notas: createForm.notas?.trim() || undefined,
      });
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleSubmitEdit() {
    if (!editingCliente) return;
    if (!editForm.nombre?.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    setError(null);
    try {
      await apiSend(`/api/clients/${editingCliente.id}`, "PUT", {
        ...editForm,
        nombre: editForm.nombre.trim(),
        apellido: editForm.apellido?.trim() || undefined,
        telefono: editForm.telefono?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        notas: editForm.notas?.trim() || undefined,
      });
      setDialogOpen(false);
      setEditingCliente(null);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleDelete(cliente: ClientResponse) {
    const ok = window.confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.");
    if (!ok) return;
    setError(null);
    try {
      await apiSend(`/api/clients/${cliente.id}`, "DELETE");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "todos", label: "Todos" },
    { key: "activos", label: "Activos" },
    { key: "morosos", label: "Morosos" },
    { key: "inactivos", label: "Inactivos" },
  ];

  return (
    <>
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-gray-900">Clientes</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Vista Figma conectada al backend</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={load} disabled={loading}>
                <RefreshCw className="mr-2 h-5 w-5" />
                {loading ? "Actualizando..." : "Refrescar"}
              </Button>
              <Button
                onClick={openCreate}
                className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Cliente
              </Button>
            </div>
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
          {clientesFiltrados.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">No hay clientes para mostrar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-gray-900">
                          {cliente.nombre} {cliente.apellido ?? ""}
                        </div>
                        <div className="mt-1 flex gap-3">
                          <button
                            onClick={() => window.alert("Detalle UI pendiente")}
                            className="text-xs text-[#ff5e62] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FileText className="h-3 w-3" />
                            Ver Cliente
                          </button>
                          <button
                            onClick={() => window.alert("Recordatorio UI pendiente")}
                            className="text-xs text-[#ff9966] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Bell className="h-3 w-3" />
                            Recordatorio
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900 font-semibold">{cliente.telefono ?? "-"}</div>
                          <div className="text-gray-500">{cliente.email ?? "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{estadoBadge(cliente.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(cliente)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cliente)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingCliente ? "Actualiza la información del cliente" : "Agrega un nuevo cliente al sistema"}
            </DialogDescription>
          </DialogHeader>

          {!editingCliente ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Nombre *"
                value={createForm.nombre}
                onChange={(e) => setCreateForm((p) => ({ ...p, nombre: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Apellido"
                value={createForm.apellido ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, apellido: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Teléfono"
                value={createForm.telefono ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, telefono: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Email"
                value={createForm.email ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-xl"
              />
              <Textarea
                placeholder="Notas"
                value={createForm.notas ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, notas: e.target.value }))}
                className="rounded-xl sm:col-span-2"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Nombre"
                value={editForm.nombre ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Apellido"
                value={editForm.apellido ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, apellido: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Teléfono"
                value={editForm.telefono ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))}
                className="rounded-xl"
              />
              <Input
                placeholder="Email"
                value={editForm.email ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-xl"
              />
              <select
                className="rounded-xl border px-3 py-2 text-sm sm:col-span-2"
                value={editForm.estado ?? "ACTIVO"}
                onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as ClientStatus }))}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="MOROSO">MOROSO</option>
              </select>
              <Textarea
                placeholder="Notas"
                value={editForm.notas ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, notas: e.target.value }))}
                className="rounded-xl sm:col-span-2"
              />
            </div>
          )}

          <Separator />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={editingCliente ? handleSubmitEdit : handleSubmitCreate}
              className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl shadow-lg"
            >
              {editingCliente ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

