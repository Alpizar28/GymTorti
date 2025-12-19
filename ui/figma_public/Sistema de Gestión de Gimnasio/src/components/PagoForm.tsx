import { useForm } from 'react-hook-form@7.55.0';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Pago, Cliente } from '../App';

interface PagoFormProps {
  onSubmit: (data: Omit<Pago, 'id'>) => void;
  onCancel: () => void;
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
}

export function PagoForm({ onSubmit, onCancel, clientes, setClientes }: PagoFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Omit<Pago, 'id'>>({
    defaultValues: {
      clienteId: '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      tipoPago: 'mensual',
      metodoPago: 'efectivo',
      referencia: '',
    },
  });

  const clienteId = watch('clienteId');
  const tipoPago = watch('tipoPago');
  const metodoPago = watch('metodoPago');

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState<string>('');

  const montosRecomendados: Record<string, number> = {
    mensual: 12500,
    trimestral: 35000,
    semestral: 65000,
    anual: 120000,
  };

  const formatColones = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      setClienteSeleccionado(cliente || null);
      
      if (cliente) {
        calcularNuevaFechaVencimiento(cliente, tipoPago);
      }
    } else {
      setClienteSeleccionado(null);
      setNuevaFechaVencimiento('');
    }
  }, [clienteId, tipoPago, clientes]);

  const calcularNuevaFechaVencimiento = (cliente: Cliente, tipo: string) => {
    const mesesMap = {
      mensual: 1,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    };

    const hoy = new Date();
    const vencimientoActual = new Date(cliente.fechaVencimiento);
    
    // Extender desde la fecha mayor entre hoy y el vencimiento actual
    const fechaBase = vencimientoActual > hoy ? vencimientoActual : hoy;
    
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + mesesMap[tipo as keyof typeof mesesMap]);
    
    setNuevaFechaVencimiento(nuevaFecha.toISOString().split('T')[0]);
  };

  const handleFormSubmit = (data: Omit<Pago, 'id'>) => {
    if (!clienteSeleccionado) return;

    // Actualizar el cliente con la nueva fecha de vencimiento
    setClientes(
      clientes.map(c =>
        c.id === clienteId
          ? { 
              ...c, 
              fechaVencimiento: nuevaFechaVencimiento,
              estado: 'activo' as const
            }
          : c
      )
    );

    // Agregar información de renovación al pago
    const pagoConRenovacion = {
      ...data,
      fechaVencimientoAnterior: clienteSeleccionado.fechaVencimiento,
      fechaVencimientoNueva: nuevaFechaVencimiento,
    };

    onSubmit(pagoConRenovacion);
  };

  const getEstadoBadge = (estado: Cliente['estado']) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500 text-white">Activo</Badge>;
      case 'por-vencer':
        return <Badge className="bg-yellow-500 text-white">Por vencer</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500 text-white">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clienteId">Cliente *</Label>
        <Select
          value={clienteId}
          onValueChange={(value) => setValue('clienteId', value)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes
              .filter(c => c.estado !== 'inactivo')
              .sort((a, b) => {
                // Priorizar vencidos y por vencer
                if (a.estado === 'vencido' && b.estado !== 'vencido') return -1;
                if (b.estado === 'vencido' && a.estado !== 'vencido') return 1;
                if (a.estado === 'por-vencer' && b.estado === 'activo') return -1;
                if (b.estado === 'por-vencer' && a.estado === 'activo') return 1;
                return 0;
              })
              .map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} {cliente.estado === 'vencido' && '🔴'} {cliente.estado === 'por-vencer' && '⚠️'}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.clienteId && (
          <p className="text-red-600 text-sm">Debes seleccionar un cliente</p>
        )}
      </div>

      {/* Información del cliente seleccionado */}
      {clienteSeleccionado && (
        <div className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado actual</p>
              <div className="mt-1">
                {getEstadoBadge(clienteSeleccionado.estado)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Vence el</p>
              <p className="font-bold text-gray-900">
                {new Date(clienteSeleccionado.fechaVencimiento).toLocaleDateString('es-CR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {clienteSeleccionado.estado === 'vencido' && (
            <div className="flex items-start gap-2 bg-red-100 p-3 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Membresía vencida</p>
                <p className="text-xs text-red-700">
                  Se renovará desde hoy ({new Date().toLocaleDateString('es-CR')})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha del Pago *</Label>
        <Input
          id="fecha"
          type="date"
          {...register('fecha', { required: 'La fecha es requerida' })}
          className="rounded-xl"
        />
        {errors.fecha && (
          <p className="text-red-600 text-sm">{errors.fecha.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoPago">Tipo de Membresía *</Label>
        <Select
          value={tipoPago}
          onValueChange={(value) => {
            setValue('tipoPago', value as 'mensual' | 'trimestral' | 'semestral' | 'anual');
            setValue('monto', montosRecomendados[value]);
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensual">Mensual (1 mes) - {formatColones(12500)}</SelectItem>
            <SelectItem value="trimestral">Trimestral (3 meses) - {formatColones(35000)}</SelectItem>
            <SelectItem value="semestral">Semestral (6 meses) - {formatColones(65000)}</SelectItem>
            <SelectItem value="anual">Anual (12 meses) - {formatColones(120000)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Nueva fecha de vencimiento calculada */}
      {nuevaFechaVencimiento && (
        <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-200">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Nueva fecha de vencimiento</p>
              <p className="font-black text-green-900" style={{ fontSize: '1.25rem' }}>
                {new Date(nuevaFechaVencimiento).toLocaleDateString('es-CR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-green-700 mt-1">
                La membresía se extenderá automáticamente
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="metodoPago">Método de Pago *</Label>
        <Select
          value={metodoPago}
          onValueChange={(value) => setValue('metodoPago', value as 'efectivo' | 'tarjeta' | 'sinpe')}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">💵 Efectivo</SelectItem>
            <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
            <SelectItem value="sinpe">📱 SINPE Móvil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(metodoPago === 'tarjeta' || metodoPago === 'sinpe') && (
        <div className="space-y-2">
          <Label htmlFor="referencia">Referencia / Número de Transacción (opcional)</Label>
          <Input
            id="referencia"
            {...register('referencia')}
            placeholder="Ej: 1234567890"
            className="rounded-xl font-mono"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="monto">Monto en Colones (₡) *</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₡</span>
          <Input
            id="monto"
            type="number"
            step="100"
            {...register('monto', { 
              required: 'El monto es requerido',
              min: { value: 100, message: 'El monto debe ser mayor a ₡100' }
            })}
            placeholder="12,500"
            className="rounded-xl pl-8 font-bold text-lg"
          />
        </div>
        {errors.monto && (
          <p className="text-red-600 text-sm">{errors.monto.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl shadow-lg"
          disabled={!clienteSeleccionado}
        >
          Registrar Pago y Renovar
        </Button>
      </div>
    </form>
  );
}
