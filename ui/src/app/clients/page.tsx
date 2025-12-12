"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type {
  ClientCreateRequest,
  ClientResponse,
  ClientStatus,
  ClientUpdateRequest,
} from "@/lib/types";

const GYM_ID = 1;

function safe(v?: string | null) {
  return v ?? "";
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<ClientCreateRequest>({
    gymId: GYM_ID,
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    notas: "",
  });

  const [editing, setEditing] = useState<ClientResponse | null>(null);
  const [editForm, setEditForm] = useState<ClientUpdateRequest>({});

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
    } catch (e: unknown) {
      setError(getErrorMessage(e) ?? "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate() {
    setError(null);
    if (!createForm.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    try {
      await apiSend<ClientResponse>("/api/clients", "POST", {
        ...createForm,
        nombre: createForm.nombre.trim(),
      });
      setCreateForm({ gymId: GYM_ID, nombre: "", apellido: "", telefono: "", email: "", notas: "" });
      await loadClients();
    } catch (e: unknown) {
      setError(getErrorMessage(e) ?? "Error creando cliente");
    }
  }

  function startEdit(c: ClientResponse) {
    setEditing(c);
    setEditForm({
      nombre: c.nombre,
      apellido: safe(c.apellido),
      telefono: safe(c.telefono),
      email: safe(c.email),
      notas: safe(c.notas),
      estado: c.estado,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setEditForm({});
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setError(null);
    try {
      await apiSend<ClientResponse>(`/api/clients/${editing.id}?gymId=${GYM_ID}`, "PUT", editForm);
      cancelEdit();
      await loadClients();
    } catch (e: unknown) {
      setError(getErrorMessage(e) ?? "Error actualizando cliente");
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-600">
            Búsqueda + creación + edición (gymId={GYM_ID}).
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="w-full rounded-xl border px-4 py-2 outline-none focus:ring"
            placeholder="Buscar por nombre, apellido, teléfono, email o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="rounded-xl border px-4 py-2 hover:bg-gray-50" onClick={loadClients}>
            Refrescar
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Nuevo cliente</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Nombre *"
              value={createForm.nombre}
              onChange={(e) => setCreateForm((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Apellido"
              value={createForm.apellido ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, apellido: e.target.value }))}
            />
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Teléfono"
              value={createForm.telefono ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, telefono: e.target.value }))}
            />
            <input
              className="rounded-xl border px-4 py-2"
              placeholder="Email"
              value={createForm.email ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            />
            <input
              className="rounded-xl border px-4 py-2 sm:col-span-2"
              placeholder="Notas"
              value={createForm.notas ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, notas: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <button className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90" onClick={handleCreate}>
              Guardar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-lg font-medium">Listado</h2>
            {loading && <span className="text-sm text-gray-600">Cargando...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-t text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Teléfono</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">
                      {c.nombre} {c.apellido ?? ""}
                    </td>
                    <td className="px-4 py-2">{c.telefono ?? "-"}</td>
                    <td className="px-4 py-2">{c.email ?? "-"}</td>
                    <td className="px-4 py-2">{c.estado}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        onClick={() => startEdit(c)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {clients.length === 0 && !loading && (
                  <tr className="border-t">
                    <td className="px-4 py-3 text-gray-600" colSpan={5}>
                      No hay clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Editar cliente #{editing.id}</h3>
                <button className="rounded-xl border px-3 py-1" onClick={cancelEdit}>
                  Cerrar
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border px-4 py-2"
                  placeholder="Nombre"
                  value={String(editForm.nombre ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                />
                <input
                  className="rounded-xl border px-4 py-2"
                  placeholder="Apellido"
                  value={String(editForm.apellido ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, apellido: e.target.value }))}
                />
                <input
                  className="rounded-xl border px-4 py-2"
                  placeholder="Teléfono"
                  value={String(editForm.telefono ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))}
                />
                <input
                  className="rounded-xl border px-4 py-2"
                  placeholder="Email"
                  value={String(editForm.email ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />

                <select
                  className="rounded-xl border px-4 py-2 sm:col-span-2"
                  value={String(editForm.estado ?? "ACTIVO")}
                  onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as ClientStatus }))}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="MOROSO">MOROSO</option>
                </select>

                <textarea
                  className="rounded-xl border px-4 py-2 sm:col-span-2"
                  placeholder="Notas"
                  value={String(editForm.notas ?? "")}
                  onChange={(e) => setEditForm((p) => ({ ...p, notas: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90" onClick={handleSaveEdit}>
                  Guardar cambios
                </button>
                <button className="rounded-xl border px-4 py-2 hover:bg-gray-50" onClick={cancelEdit}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
