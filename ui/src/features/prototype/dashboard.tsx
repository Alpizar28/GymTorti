"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, DollarSign, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesTab } from "@/features/prototype/components/clientes-tab";
import { MedicionesTab } from "@/features/prototype/components/mediciones-tab";
import { PagosTab } from "@/features/prototype/components/pagos-tab";
import { loadJson, saveJson } from "@/features/prototype/storage";
import type { Cliente, Medicion, Pago } from "@/features/prototype/types";

const STORAGE_CLIENTES = "mastergym-clientes";
const STORAGE_PAGOS = "mastergym-pagos";
const STORAGE_MEDICIONES = "mastergym-mediciones";

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

function normalizeClienteEstado(cliente: Cliente): Cliente {
  if (cliente.estado === "inactivo") return cliente;

  const now = new Date();
  const due = new Date(cliente.fechaVencimiento);
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (due < now) return { ...cliente, estado: "vencido" };
  if (days <= 7 && days > 0 && cliente.estado === "activo") return { ...cliente, estado: "por-vencer" };
  if (days > 7 && (cliente.estado === "vencido" || cliente.estado === "por-vencer")) return { ...cliente, estado: "activo" };
  return cliente;
}

export function PrototypeDashboard() {
  const [clientes, setClientes] = useState<Cliente[]>(() => loadJson(STORAGE_CLIENTES, []));
  const [pagos, setPagos] = useState<Pago[]>(() => loadJson(STORAGE_PAGOS, []));
  const [mediciones, setMediciones] = useState<Medicion[]>(() => loadJson(STORAGE_MEDICIONES, []));
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => saveJson(STORAGE_CLIENTES, clientes), [clientes]);
  useEffect(() => saveJson(STORAGE_PAGOS, pagos), [pagos]);
  useEffect(() => saveJson(STORAGE_MEDICIONES, mediciones), [mediciones]);

  useEffect(() => {
    setClientes((prev) => {
      const next = prev.map(normalizeClienteEstado);
      const changed =
        next.length !== prev.length ||
        next.some((c, i) => c.estado !== prev[i]?.estado || c.fechaVencimiento !== prev[i]?.fechaVencimiento);
      return changed ? next : prev;
    });
  }, [clientes]);

  const clientesActivos = clientes.filter((c) => c.estado === "activo" || c.estado === "por-vencer").length;
  const clientesVencidos = clientes.filter((c) => c.estado === "vencido").length;
  const clientesPorVencer = clientes.filter((c) => c.estado === "por-vencer").length;

  const ingresosMes = useMemo(() => {
    const now = new Date();
    return pagos
      .filter((p) => {
        const d = new Date(p.fecha);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.monto, 0);
  }, [pagos]);

  const pagosMes = useMemo(() => {
    const now = new Date();
    return pagos.filter((p) => {
      const d = new Date(p.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [pagos]);

  const clientesFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => {
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.apellido.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        c.estado.toLowerCase().includes(q)
      );
    });
  }, [clientes, searchQuery]);

  const warnings = clientesPorVencer + clientesVencidos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] shadow-lg">
        <div className="mx-auto max-w-6xl px-6 py-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
                <span className="text-lg font-black">MG</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">MasterGym</p>
                <h1 className="text-3xl font-black leading-tight">Sistema de Gestión</h1>
                <p className="text-white/80">UI migrada desde Figma (prototipo sin backend)</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar clientes..."
                  className="h-11 rounded-2xl border-white/20 bg-white/15 pl-9 text-white placeholder:text-white/70"
                />
              </div>
              {warnings > 0 && (
                <Badge className="w-fit rounded-2xl bg-white text-[#ff5e62] hover:bg-white">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  {warnings} alerta{warnings !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Total Clientes</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                {clientes.length}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-green-600">{clientesActivos} activos</span>
                {clientesPorVencer > 0 && <span className="text-sm font-semibold text-yellow-600">{clientesPorVencer} por vencer</span>}
                {clientesVencidos > 0 && <span className="text-sm font-semibold text-red-600">{clientesVencidos} vencidos</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Ingresos del Mes</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-[#ff9966] to-[#ff5e62] p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                {colones.format(ingresosMes)}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {pagosMes} pago{pagosMes !== 1 ? "s" : ""} registrado{pagosMes !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Mediciones</CardTitle>
              <div className="rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] p-2">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                {mediciones.length}
              </div>
              <p className="mt-2 text-sm text-gray-600">Registradas en total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="h-auto rounded-2xl border-none bg-white p-1.5 shadow-md">
            <TabsTrigger
              value="clientes"
              className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff5e62] data-[state=active]:to-[#ff9966] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Clientes
            </TabsTrigger>
            <TabsTrigger
              value="pagos"
              className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff5e62] data-[state=active]:to-[#ff9966] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Pagos
            </TabsTrigger>
            <TabsTrigger
              value="mediciones"
              className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff5e62] data-[state=active]:to-[#ff9966] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Mediciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <ClientesTab clientes={clientesFiltrados} setClientes={setClientes} allClientes={clientes} pagos={pagos} mediciones={mediciones} />
          </TabsContent>
          <TabsContent value="pagos">
            <PagosTab pagos={pagos} setPagos={setPagos} clientes={clientes} setClientes={setClientes} />
          </TabsContent>
          <TabsContent value="mediciones">
            <MedicionesTab mediciones={mediciones} setMediciones={setMediciones} clientes={clientes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
