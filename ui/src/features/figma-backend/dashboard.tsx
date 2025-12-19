"use client";

import { useMemo, useState } from "react";
import { Activity, DollarSign, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesTabBackend } from "@/features/figma-backend/clientes-tab";
import { PagosTabBackend } from "@/features/figma-backend/pagos-tab";
import { MedicionesUiOnlyTab } from "@/features/figma-backend/mediciones-ui-only";

const colones = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function FigmaBackendDashboard({ defaultTab }: { defaultTab?: "clientes" | "pagos" | "mediciones" }) {
  const [searchQuery, setSearchQuery] = useState("");

  const tab = useMemo(() => defaultTab ?? "clientes", [defaultTab]);

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
                <p className="text-white/80">UI de Figma + backend (DB)</p>
              </div>
            </div>

            <div className="relative w-full md:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar clientes..."
                className="h-11 rounded-2xl border-white/20 bg-white/15 pl-9 text-white placeholder:text-white/70"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Total Clientes</CardTitle>
              <div className="p-2 bg-gradient-to-br from-[#ff5e62] to-[#ff9966] rounded-xl">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                —
              </div>
              <p className="text-sm text-gray-600 mt-2">Conectado al backend</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Ingresos del Mes</CardTitle>
              <div className="p-2 bg-gradient-to-br from-[#ff9966] to-[#ff5e62] rounded-xl">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                {colones.format(0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Conectado al backend</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Mediciones</CardTitle>
              <div className="p-2 bg-gradient-to-br from-[#ff5e62] to-[#ff9966] rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: "2rem" }}>
                —
              </div>
              <p className="text-sm text-gray-600 mt-2">UI solamente</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={tab} className="space-y-6">
          <TabsList className="bg-white shadow-md rounded-2xl p-1.5 h-auto border-none">
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
            <ClientesTabBackend searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="pagos">
            <PagosTabBackend />
          </TabsContent>
          <TabsContent value="mediciones">
            <MedicionesUiOnlyTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

