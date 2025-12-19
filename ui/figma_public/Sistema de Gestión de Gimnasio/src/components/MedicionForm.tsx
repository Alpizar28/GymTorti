import { useForm } from 'react-hook-form@7.55.0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Medicion, Cliente } from '../App';

interface MedicionFormProps {
  onSubmit: (data: Omit<Medicion, 'id'>) => void;
  onCancel: () => void;
  clientes: Cliente[];
}

export function MedicionForm({ onSubmit, onCancel, clientes }: MedicionFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Omit<Medicion, 'id'>>({
    defaultValues: {
      clienteId: '',
      fecha: new Date().toISOString().split('T')[0],
      peso: 0,
      altura: 0,
      pechoCm: 0,
      cinturaCm: 0,
      caderaCm: 0,
      brazoIzqCm: 0,
      brazoDerCm: 0,
      piernaIzqCm: 0,
      piernaDerCm: 0,
      grasaCorporal: undefined,
    },
  });

  const clienteId = watch('clienteId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              .filter(c => c.estado === 'activo')
              .map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.clienteId && (
          <p className="text-red-600 text-sm">Debes seleccionar un cliente</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha *</Label>
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

      <div className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-4 rounded-2xl">
        <h4 className="font-semibold text-gray-900 mb-4">Datos Básicos</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peso">Peso (kg) *</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              {...register('peso', { 
                required: 'El peso es requerido',
                min: { value: 1, message: 'El peso debe ser mayor a 0' }
              })}
              placeholder="70.5"
              className="rounded-xl bg-white"
            />
            {errors.peso && (
              <p className="text-red-600 text-sm">{errors.peso.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="altura">Altura (cm) *</Label>
            <Input
              id="altura"
              type="number"
              step="0.1"
              {...register('altura', { 
                required: 'La altura es requerida',
                min: { value: 1, message: 'La altura debe ser mayor a 0' }
              })}
              placeholder="175"
              className="rounded-xl bg-white"
            />
            {errors.altura && (
              <p className="text-red-600 text-sm">{errors.altura.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="grasaCorporal">% Grasa Corporal (opcional)</Label>
          <Input
            id="grasaCorporal"
            type="number"
            step="0.1"
            {...register('grasaCorporal', {
              min: { value: 0, message: 'Debe ser mayor a 0' },
              max: { value: 100, message: 'Debe ser menor a 100' }
            })}
            placeholder="15.5"
            className="rounded-xl bg-white"
          />
          {errors.grasaCorporal && (
            <p className="text-red-600 text-sm">{errors.grasaCorporal.message}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl">
        <h4 className="font-semibold text-gray-900 mb-4">Circunferencias Torso (cm)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pechoCm">Pecho *</Label>
            <Input
              id="pechoCm"
              type="number"
              step="0.1"
              {...register('pechoCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="95"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cinturaCm">Cintura *</Label>
            <Input
              id="cinturaCm"
              type="number"
              step="0.1"
              {...register('cinturaCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="80"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caderaCm">Cadera *</Label>
            <Input
              id="caderaCm"
              type="number"
              step="0.1"
              {...register('caderaCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="95"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl">
        <h4 className="font-semibold text-gray-900 mb-4">Circunferencias Brazos (cm)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brazoIzqCm">Brazo Izq. *</Label>
            <Input
              id="brazoIzqCm"
              type="number"
              step="0.1"
              {...register('brazoIzqCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="32"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brazoDerCm">Brazo Der. *</Label>
            <Input
              id="brazoDerCm"
              type="number"
              step="0.1"
              {...register('brazoDerCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="32"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl">
        <h4 className="font-semibold text-gray-900 mb-4">Circunferencias Piernas (cm)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="piernaIzqCm">Pierna Izq. *</Label>
            <Input
              id="piernaIzqCm"
              type="number"
              step="0.1"
              {...register('piernaIzqCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="55"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="piernaDerCm">Pierna Der. *</Label>
            <Input
              id="piernaDerCm"
              type="number"
              step="0.1"
              {...register('piernaDerCm', { 
                required: 'Requerido',
                min: { value: 0, message: 'Debe ser mayor a 0' }
              })}
              placeholder="55"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl shadow-lg">
          Registrar Medición
        </Button>
      </div>
    </form>
  );
}
