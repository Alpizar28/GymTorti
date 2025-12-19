import { useForm } from 'react-hook-form@7.55.0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { Cliente } from '../App';

interface ClienteFormProps {
  onSubmit: (data: Omit<Cliente, 'id'>) => void;
  onCancel: () => void;
  initialData?: Cliente;
}

export function ClienteForm({ onSubmit, onCancel, initialData }: ClienteFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Omit<Cliente, 'id'>>({
    defaultValues: initialData || {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      estado: 'activo',
      tipoMembresia: 'mensual',
      foto: '',
      contactoEmergencia: '',
      observaciones: '',
    },
  });

  const estado = watch('estado');
  const tipoMembresia = watch('tipoMembresia');
  const fechaInicio = watch('fechaInicio');

  // Calcular fecha de vencimiento automáticamente
  const calcularFechaVencimiento = (inicio: string, tipo: string) => {
    const fecha = new Date(inicio);
    const mesesMap = {
      mensual: 1,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    };
    fecha.setMonth(fecha.getMonth() + mesesMap[tipo as keyof typeof mesesMap]);
    return fecha.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            {...register('nombre', { required: 'El nombre es requerido' })}
            placeholder="Juan"
            className="rounded-xl"
          />
          {errors.nombre && (
            <p className="text-red-600 text-sm">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            {...register('apellido', { required: 'El apellido es requerido' })}
            placeholder="Pérez"
            className="rounded-xl"
          />
          {errors.apellido && (
            <p className="text-red-600 text-sm">{errors.apellido.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { 
              required: 'El correo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo inválido'
              }
            })}
            placeholder="juan@ejemplo.com"
            className="rounded-xl"
          />
          {errors.email && (
            <p className="text-red-600 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            {...register('telefono', { required: 'El teléfono es requerido' })}
            placeholder="+52 123 456 7890"
            className="rounded-xl"
          />
          {errors.telefono && (
            <p className="text-red-600 text-sm">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foto">URL de Foto (opcional)</Label>
        <Input
          id="foto"
          type="url"
          {...register('foto')}
          placeholder="https://ejemplo.com/foto.jpg"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoMembresia">Tipo de Membresía *</Label>
        <Select
          value={tipoMembresia}
          onValueChange={(value) => {
            setValue('tipoMembresia', value as 'mensual' | 'trimestral' | 'semestral' | 'anual');
            if (fechaInicio) {
              setValue('fechaVencimiento', calcularFechaVencimiento(fechaInicio, value));
            }
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensual">Mensual (1 mes)</SelectItem>
            <SelectItem value="trimestral">Trimestral (3 meses)</SelectItem>
            <SelectItem value="semestral">Semestral (6 meses)</SelectItem>
            <SelectItem value="anual">Anual (12 meses)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
          <Input
            id="fechaInicio"
            type="date"
            {...register('fechaInicio', { required: 'La fecha es requerida' })}
            onChange={(e) => {
              setValue('fechaInicio', e.target.value);
              setValue('fechaVencimiento', calcularFechaVencimiento(e.target.value, tipoMembresia));
            }}
            className="rounded-xl"
          />
          {errors.fechaInicio && (
            <p className="text-red-600 text-sm">{errors.fechaInicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
          <Input
            id="fechaVencimiento"
            type="date"
            {...register('fechaVencimiento', { required: 'La fecha es requerida' })}
            className="rounded-xl bg-gray-50"
          />
          {errors.fechaVencimiento && (
            <p className="text-red-600 text-sm">{errors.fechaVencimiento.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactoEmergencia">Contacto de Emergencia (opcional)</Label>
        <Input
          id="contactoEmergencia"
          {...register('contactoEmergencia')}
          placeholder="Nombre y teléfono: María Pérez - 123 456 7890"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
        <Textarea
          id="observaciones"
          {...register('observaciones')}
          placeholder="Notas adicionales, condiciones médicas, objetivos, etc."
          className="rounded-xl min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select
          value={estado}
          onValueChange={(value) => setValue('estado', value as 'activo' | 'vencido' | 'inactivo')}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecciona un estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl shadow-lg">
          {initialData ? 'Guardar Cambios' : 'Agregar Cliente'}
        </Button>
      </div>
    </form>
  );
}
