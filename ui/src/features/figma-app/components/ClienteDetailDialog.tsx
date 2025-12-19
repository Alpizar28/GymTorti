"use client";

import { AlertCircle, Calendar, CreditCard, Mail, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Cliente } from "../types";

interface ClienteDetailDialogProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDetailDialog({ cliente, open, onOpenChange }: ClienteDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Información del Cliente</DialogTitle>
          <DialogDescription>Detalles completos del miembro</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-6">
            {cliente.foto ? (
              <ImageWithFallback
                src={cliente.foto}
                alt={`${cliente.nombre} ${cliente.apellido}`}
                className="h-20 w-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] text-2xl font-bold text-white shadow-lg">
                {cliente.nombre[0]}
                {cliente.apellido[0]}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {cliente.nombre} {cliente.apellido}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={cliente.estado === "activo" ? "default" : "destructive"}
                  className={
                    cliente.estado === "activo"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                      : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                  }
                >
                  {cliente.estado}
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900">
                  {cliente.tipoMembresia}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 font-semibold text-gray-900">
              <User className="h-4 w-4 text-[#ff5e62]" />
              Información de Contacto
            </h4>
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Correo</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.telefono}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 text-[#ff5e62]" />
              Membresía
            </h4>
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Inicio</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(cliente.fechaInicio).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(cliente.fechaVencimiento).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {cliente.contactoEmergencia && (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                <AlertCircle className="h-4 w-4 text-[#ff5e62]" />
                Contacto de Emergencia
              </h4>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-gray-900">{cliente.contactoEmergencia}</p>
              </div>
            </div>
          )}

          {cliente.observaciones && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Observaciones</h4>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-700">{cliente.observaciones}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

