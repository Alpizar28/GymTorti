"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Mail,
  NotebookPen,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import type {
  ClientCreateRequest,
  ClientResponse,
  ClientStatus,
  ClientUpdateRequest,
  Page,
} from "@/lib/types";
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

function normalize(text?: string | null) {
  return text ?? "";
}

function friendlyError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

function statusBadge(status: ClientStatus) {
  const map: Record<ClientStatus, string> = {
    ACTIVO: "bg-green-500 text-white border-none",
    INACTIVO: "bg-gray-200 text-gray-900",
    MOROSO: "bg-red-500 text-white border-none",
  };
  return (
    <Badge className={`rounded-xl ${map[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function ClientsPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "activos" | "morosos" | "inactivos">("todos");
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ClientCreateRequest>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<ClientUpdateRequest>({});
  const [editing, setEditing] = useState<ClientResponse | null>(null);

  const query = useMemo(() => {
    const q = search.trim();
    const base = `/api/clients?page=${page}&size=${pageSize}&sort=fechaRegistro,desc`;
    return q ? `${base}&search=${encodeURIComponent(q)}` : base;
  }, [page, pageSize, search]);

  async function loadClients() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Page<ClientResponse>>(query);
      setClients(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const counts = useMemo(() => {
    const activos = clients.filter((c) => c.estado === "ACTIVO").length;
    const morosos = clients.filter((c) => c.estado === "MOROSO").length;
    const inactivos = clients.filter((c) => c.estado === "INACTIVO").length;
    return { total: totalElements, activos, morosos, inactivos };
  }, [clients, totalElements]);

  const visibleClients = useMemo(() => {
    if (filter === "activos") return clients.filter((c) => c.estado === "ACTIVO");
    if (filter === "morosos") return clients.filter((c) => c.estado === "MOROSO");
    if (filter === "inactivos") return clients.filter((c) => c.estado === "INACTIVO");
    return clients;
  }, [clients, filter]);

  async function handleCreate() {
    if (!createForm.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError(null);
    try {
      await apiSend<ClientResponse>("/api/clients", "POST", {
        ...createForm,
        nombre: createForm.nombre.trim(),
        apellido: createForm.apellido?.trim() || undefined,
        telefono: createForm.telefono?.trim() || undefined,
        email: createForm.email?.trim() || undefined,
        notas: createForm.notas?.trim() || undefined,
      });
      setCreateForm(EMPTY_CREATE);
      setCreateOpen(false);
      await loadClients();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function startEdit(target: ClientResponse) {
    setEditing(target);
    setEditForm({
      nombre: target.nombre,
      apellido: normalize(target.apellido),
      telefono: normalize(target.telefono),
      email: normalize(target.email),
      notas: normalize(target.notas),
      estado: target.estado,
    });
    setEditOpen(true);
  }

  function resetEdit() {
    setEditing(null);
    setEditForm({});
    setEditOpen(false);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editForm.nombre?.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError(null);
    try {
      await apiSend(`/api/clients/${editing.id}`, "PUT", {
        ...editForm,
        nombre: editForm.nombre.trim(),
        apellido: editForm.apellido?.trim() || undefined,
        telefono: editForm.telefono?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        notas: editForm.notas?.trim() || undefined,
      });
      resetEdit();
      await loadClients();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleDelete(target: ClientResponse) {
    const ok = window.confirm(`Eliminar el cliente #${target.id}?`);
    if (!ok) return;
    setError(null);
    try {
      await apiSend(`/api/clients/${target.id}`, "DELETE");
      await loadClients();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Total clientes</CardTitle>
            <div className="rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] p-2">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-sm text-gray-500">Registrados en el backend</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Activos</CardTitle>
            <Badge className="rounded-full bg-green-500 text-white border-none">{counts.activos}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Estado ACTIVO según API</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-500">Morosos</CardTitle>
            <Badge className="rounded-full bg-red-500 text-white border-none">{counts.morosos}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Estado MOROSO según API</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="gap-4 border-b bg-gradient-to-r from-white to-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Clientes</CardTitle>
            <p className="text-sm text-gray-500">Búsqueda, alta y edición conectadas al backend.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={loadClients} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading ? "Actualizando..." : "Refrescar"}
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido, teléfono, email o estado"
              className="rounded-xl pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["activos", "Activos"],
                ["morosos", "Morosos"],
                ["inactivos", "Inactivos"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={
                  filter === key
                    ? "rounded-full bg-gradient-to-r from-[#ff5e62] to-[#ff9966] px-4 py-2 text-sm font-semibold text-white shadow"
                    : "rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-50"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <Table containerClassName="overflow-hidden rounded-3xl border bg-white shadow-sm" className="w-full text-sm">
            <TableHeader className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {client.nombre} {client.apellido ? client.apellido : ""}
                    </div>
                    {client.notas && <p className="text-xs text-gray-500">{client.notas}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {client.telefono || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {client.email || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(client.estado)}</TableCell>
                  <TableCell className="text-gray-700">{formatDate(client.fechaRegistro)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => startEdit(client)}>
                        <NotebookPen className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDelete(client)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visibleClients.length === 0 && !loading && (
                <TableRow>
                  <TableCell className="py-6 text-center text-gray-500" colSpan={5}>
                    Sin clientes aún. Crea uno nuevo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              Página <span className="font-semibold">{page + 1}</span> de{" "}
              <span className="font-semibold">{Math.max(totalPages, 1)}</span> •{" "}
              <span className="font-semibold">{totalElements}</span> clientes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={loading || page <= 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage((p) => Math.min(Math.max(totalPages - 1, 0), p + 1))}
                disabled={loading || page >= totalPages - 1}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo cliente</DialogTitle>
            <DialogDescription>Se guardará en el backend (POST /api/clients).</DialogDescription>
          </DialogHeader>
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
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg" onClick={handleCreate}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : resetEdit())}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar cliente</DialogTitle>
            <DialogDescription>PUT /api/clients/{editing?.id} (usa header X-GYM-ID)</DialogDescription>
          </DialogHeader>
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
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={resetEdit}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg" onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

