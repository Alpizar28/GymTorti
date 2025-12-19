import { Badge } from './ui/badge';
import type { Medicion } from '../App';

interface MedicionDetailProps {
  medicion: Medicion;
  clienteNombre: string;
}

export function MedicionDetail({ medicion, clienteNombre }: MedicionDetailProps) {
  const calcularIMC = (peso: number, altura: number) => {
    const alturaMetros = altura / 100;
    return (peso / (alturaMetros * alturaMetros)).toFixed(1);
  };

  const getIMCCategoria = (imc: number) => {
    if (imc < 18.5) return { texto: 'Bajo peso', color: 'bg-blue-100 text-blue-900' };
    if (imc < 25) return { texto: 'Normal', color: 'bg-green-100 text-green-900' };
    if (imc < 30) return { texto: 'Sobrepeso', color: 'bg-yellow-100 text-yellow-900' };
    return { texto: 'Obesidad', color: 'bg-red-100 text-red-900' };
  };

  const imc = parseFloat(calcularIMC(medicion.peso, medicion.altura));
  const categoria = getIMCCategoria(imc);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-6 rounded-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-bold text-lg text-gray-900">{clienteNombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-bold text-lg text-gray-900">{new Date(medicion.fecha).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
        <h3 className="font-semibold text-gray-900">Datos Básicos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Peso</p>
            <p className="text-2xl font-bold text-[#ff5e62]">{medicion.peso}</p>
            <p className="text-xs text-gray-500">kg</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Altura</p>
            <p className="text-2xl font-bold text-[#ff9966]">{medicion.altura}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-gray-600 mb-1">IMC</p>
            <p className="text-2xl font-bold text-gray-900">{imc}</p>
            <Badge className={`${categoria.color} mt-1 text-xs`}>
              {categoria.texto}
            </Badge>
          </div>
          {medicion.grasaCorporal && (
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-600 mb-1">Grasa</p>
              <p className="text-2xl font-bold text-purple-600">{medicion.grasaCorporal}</p>
              <p className="text-xs text-gray-500">%</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
        <h3 className="font-semibold text-gray-900">Circunferencias Torso</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Pecho</p>
            <p className="text-xl font-bold text-gray-900">{medicion.pechoCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Cintura</p>
            <p className="text-xl font-bold text-gray-900">{medicion.cinturaCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Cadera</p>
            <p className="text-xl font-bold text-gray-900">{medicion.caderaCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
        <h3 className="font-semibold text-gray-900">Circunferencias Brazos</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Brazo Izquierdo</p>
            <p className="text-xl font-bold text-gray-900">{medicion.brazoIzqCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Brazo Derecho</p>
            <p className="text-xl font-bold text-gray-900">{medicion.brazoDerCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
        <h3 className="font-semibold text-gray-900">Circunferencias Piernas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Pierna Izquierda</p>
            <p className="text-xl font-bold text-gray-900">{medicion.piernaIzqCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-600 mb-2">Pierna Derecha</p>
            <p className="text-xl font-bold text-gray-900">{medicion.piernaDerCm}</p>
            <p className="text-xs text-gray-500">cm</p>
          </div>
        </div>
      </div>
    </div>
  );
}
