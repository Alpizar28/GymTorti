"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function MedicionesUiOnlyTab() {
  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-gray-900">Mediciones Corporales</CardTitle>
            <p className="text-sm text-gray-600 mt-1">UI solamente (backend pendiente)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-500 text-lg">
            Esta sección se deja en UI hasta que esté listo el backend de mediciones.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

