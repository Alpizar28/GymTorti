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
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import type {
  ClientCreateRequest,
  ClientResponse,
  ClientStatus,
  ClientUpdateRequest,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const GYM_ID = 1;

const EMPTY_CREATE: ClientCreateRequest = {
  gymId: GYM_ID,
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

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ClientCreateRequest>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<ClientUpdateRequest>({});
  const [editing, setEditing] = useState<ClientResponse | null>(null);

  const query = useMemo(() => {
    const q = search.trim();
    return q
      ? `/api/clients?gymId=${GYM_ID}&search=${encodeURIComponent(q)}`
      : `/api/clients?gymId=${GYM_ID}`;
  }, [search]);

  async function loadClients() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ClientResponse[]>(query);
      setClients(data);
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

  const counts = useMemo(() => {
    const activos = clients.filter((c) => c.estado === "ACTIVO").length;
    const morosos = clients.filter((c) => c.estado === "MOROSO").length;
    const inactivos = clients.filter((c) => c.estado === "INACTIVO").length;
    return { total: clients.length, activos, morosos, inactivos };
  }, [clients]);

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
    setError(null);
    try {
      await apiSend<ClientResponse>(`/api/clients/${editing.id}?gymId=${GYM_ID}`, "PUT", {
        ...editForm,
        nombre: editForm.nombre?.trim(),
        apellido: editForm.apellido?.trim(),
        telefono: editForm.telefono?.trim(),
        email: editForm.email?.trim(),
        notas: editForm.notas?.trim(),
      });
      resetEdit();
      await loadClients();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleDelete(target: ClientResponse) {
    const ok = window.confirm(`¿Eliminar al cliente "${target.nombre} ${target.apellido ?? ""}"?`);
    if (!ok) return;
    setError(null);
    try {
      await apiSend(`/api/clients/${target.id}?gymId=${GYM_ID}`, "DELETE");
      await loadClients();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">MasterGym</p>
            <h1 className="text-3xl font-black leading-8">Clientes (Gym #{GYM_ID})</h1>
            <p className="text-white/80">UI del figma conectada a tu backend de Spring Boot.</p>
          </div>
          <div className="flex gap-2">
            {counts.morosos > 0 && (
              <Badge variant="destructive" className="rounded-full bg-white text-[#ff5e62] hover:bg-white">
                <ShieldAlert className="mr-1 h-4 w-4" />
                {counts.morosos} moroso{counts.morosos === 1 ? "" : "s"}
              </Badge>
            )}
            {counts.inactivos > 0 && (
              <Badge className="rounded-full bg-black/30 text-white border-white/30">
                {counts.inactivos} inactivo{counts.inactivos === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
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
                className="pl-9 rounded-xl"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {client.nombre} {client.apellido ? client.apellido : ""}
                        </div>
                        {client.notas && <p className="text-xs text-gray-500">{client.notas}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {client.telefono || "-"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {client.email || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(client.estado)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(client.fechaRegistro)}</td>
                      <td className="px-4 py-3 text-right">
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
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                        Sin clientes aún. Crea uno nuevo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

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
            <Button
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
              onClick={handleCreate}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : resetEdit())}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar cliente</DialogTitle>
            <DialogDescription>PUT /api/clients/{editing?.id}?gymId={GYM_ID}</DialogDescription>
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
            <Button
              className="rounded-xl bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg"
              onClick={handleSaveEdit}
            >
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
