import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Users, DollarSign, TrendingUp, Activity, AlertCircle, Search } from 'lucide-react';
import { ClientesTab } from './components/ClientesTab';
import { PagosTab } from './components/PagosTab';
import { MedicionesTab } from './components/MedicionesTab';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: 'activo' | 'vencido' | 'por-vencer' | 'inactivo';
  tipoMembresia: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  foto?: string;
  contactoEmergencia?: string;
  observaciones?: string;
}

export interface Pago {
  id: string;
  clienteId: string;
  monto: number;
  fecha: string;
  tipoPago: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  metodoPago: 'efectivo' | 'tarjeta' | 'sinpe';
  referencia?: string;
  fechaVencimientoAnterior?: string;
  fechaVencimientoNueva?: string;
}

export interface Medicion {
  id: string;
  clienteId: string;
  fecha: string;
  peso: number;
  altura: number;
  pechoCm: number;
  cinturaCm: number;
  caderaCm: number;
  brazoIzqCm: number;
  brazoDerCm: number;
  piernaIzqCm: number;
  piernaDerCm: number;
  grasaCorporal?: number;
  notas?: string;
}

function App() {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('mastergym-clientes');
    return saved ? JSON.parse(saved) : [];
  });

  const [pagos, setPagos] = useState<Pago[]>(() => {
    const saved = localStorage.getItem('mastergym-pagos');
    return saved ? JSON.parse(saved) : [];
  });

  const [mediciones, setMediciones] = useState<Medicion[]>(() => {
    const saved = localStorage.getItem('mastergym-mediciones');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('mastergym-clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('mastergym-pagos', JSON.stringify(pagos));
  }, [pagos]);

  useEffect(() => {
    localStorage.setItem('mastergym-mediciones', JSON.stringify(mediciones));
  }, [mediciones]);

  // Verificar y actualizar estados de clientes
  useEffect(() => {
    const now = new Date();
    const updatedClientes = clientes.map(cliente => {
      const vencimiento = new Date(cliente.fechaVencimiento);
      const diasParaVencer = Math.ceil((vencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (vencimiento < now && cliente.estado !== 'inactivo') {
        return { ...cliente, estado: 'vencido' as const };
      } else if (diasParaVencer <= 7 && diasParaVencer > 0 && cliente.estado === 'activo') {
        return { ...cliente, estado: 'por-vencer' as const };
      } else if (diasParaVencer > 7 && (cliente.estado === 'vencido' || cliente.estado === 'por-vencer')) {
        return { ...cliente, estado: 'activo' as const };
      }
      return cliente;
    });
    
    if (JSON.stringify(updatedClientes) !== JSON.stringify(clientes)) {
      setClientes(updatedClientes);
    }
  }, [clientes]);

  const clientesActivos = clientes.filter(c => c.estado === 'activo' || c.estado === 'por-vencer').length;
  const clientesVencidos = clientes.filter(c => c.estado === 'vencido').length;
  const clientesPorVencer = clientes.filter(c => c.estado === 'por-vencer').length;
  
  const ingresosMes = pagos
    .filter(p => {
      const pagoDate = new Date(p.fecha);
      const now = new Date();
      return pagoDate.getMonth() === now.getMonth() && 
             pagoDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.monto, 0);

  const totalMediciones = mediciones.length;
  const pagosMes = pagos.filter(p => {
    const pagoDate = new Date(p.fecha);
    const now = new Date();
    return pagoDate.getMonth() === now.getMonth() && 
           pagoDate.getFullYear() === now.getFullYear();
  }).length;

  // Búsqueda de clientes
  const clientesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    
    const query = searchQuery.toLowerCase();
    return clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(query) ||
      cliente.apellido.toLowerCase().includes(query) ||
      cliente.email.toLowerCase().includes(query) ||
      cliente.telefono.includes(query) ||
      cliente.estado.toLowerCase().includes(query)
    );
  }, [clientes, searchQuery]);

  const formatColones = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-2xl p-3 shadow-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1710746904773-73e073fd1549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBmaXRuZXNzJTIwbG9nb3xlbnwxfHx8fDE3NjM2MDQyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="MasterGym Logo"
                  className="h-12 w-12 object-cover rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-white font-black tracking-tight" style={{ fontSize: '2rem' }}>MasterGym</h1>
                <p className="text-white/90">Poder y Pasión</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {clientesPorVencer > 0 && (
                <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  {clientesPorVencer} por vencer
                </Badge>
              )}
              {clientesVencidos > 0 && (
                <Badge variant="destructive" className="flex items-center gap-2 px-4 py-2 bg-white text-[#ff5e62] hover:bg-white/90">
                  <AlertCircle className="h-4 w-4" />
                  {clientesVencidos} vencida{clientesVencidos !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Barra de búsqueda global */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar clientes por nombre, teléfono, correo o estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl shadow-lg border-none bg-white text-lg"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2 ml-1">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Total Clientes</CardTitle>
              <div className="p-2 bg-gradient-to-br from-[#ff5e62] to-[#ff9966] rounded-xl">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-gray-900" style={{ fontSize: '2rem' }}>{clientes.length}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm text-green-600 font-semibold">{clientesActivos} activos</span>
                {clientesPorVencer > 0 && (
                  <span className="text-sm text-yellow-600 font-semibold">{clientesPorVencer} por vencer</span>
                )}
                {clientesVencidos > 0 && (
                  <span className="text-sm text-red-600 font-semibold">{clientesVencidos} vencidos</span>
                )}
              </div>
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
              <div className="font-black text-gray-900" style={{ fontSize: '2rem' }}>{formatColones(ingresosMes)}</div>
              <p className="text-sm text-gray-600 mt-2">
                {pagosMes} pago{pagosMes !== 1 ? 's' : ''} registrado{pagosMes !== 1 ? 's' : ''}
              </p>
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
              <div className="font-black text-gray-900" style={{ fontSize: '2rem' }}>{totalMediciones}</div>
              <p className="text-sm text-gray-600 mt-2">
                Registradas en total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="clientes" className="space-y-6">
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
            <ClientesTab 
              clientes={clientesFiltrados} 
              setClientes={setClientes}
              allClientes={clientes}
              pagos={pagos}
              mediciones={mediciones}
            />
          </TabsContent>

          <TabsContent value="pagos">
            <PagosTab 
              pagos={pagos}
              setPagos={setPagos}
              clientes={clientes}
              setClientes={setClientes}
            />
          </TabsContent>

          <TabsContent value="mediciones">
            <MedicionesTab 
              mediciones={mediciones}
              setMediciones={setMediciones}
              clientes={clientes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
