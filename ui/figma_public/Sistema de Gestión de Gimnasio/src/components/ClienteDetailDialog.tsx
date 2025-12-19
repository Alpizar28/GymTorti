import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Mail, Phone, Calendar, CreditCard, User, AlertCircle } from 'lucide-react';
import type { Cliente } from '../App';

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
          <DialogDescription>
            Detalles completos del miembro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Foto y nombre */}
          <div className="flex items-center gap-4 pb-6 border-b">
            {cliente.foto ? (
              <ImageWithFallback
                src={cliente.foto}
                alt={`${cliente.nombre} ${cliente.apellido}`}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {cliente.nombre[0]}{cliente.apellido[0]}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {cliente.nombre} {cliente.apellido}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={cliente.estado === 'activo' ? 'default' : 'destructive'}
                  className={cliente.estado === 'activo' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}
                >
                  {cliente.estado}
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900">
                  {cliente.tipoMembresia}
                </Badge>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#ff5e62]" />
              Información de Contacto
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Correo</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.telefono}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de membresía */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#ff5e62]" />
              Membresía
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Inicio</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(cliente.fechaInicio).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(cliente.fechaVencimiento).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto de emergencia */}
          {cliente.contactoEmergencia && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#ff5e62]" />
                Contacto de Emergencia
              </h4>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-sm text-gray-900">{cliente.contactoEmergencia}</p>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {cliente.observaciones && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Observaciones</h4>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{cliente.observaciones}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
