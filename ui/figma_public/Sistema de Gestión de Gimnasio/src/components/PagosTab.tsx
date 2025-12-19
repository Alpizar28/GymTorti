import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Trash2, Download, BarChart3 } from 'lucide-react';
import { PagoForm } from './PagoForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Pago, Cliente } from '../App';

interface PagosTabProps {
  pagos: Pago[];
  setPagos: (pagos: Pago[]) => void;
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
}

export function PagosTab({ pagos, setPagos, clientes, setClientes }: PagosTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatColones = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  const handleAddPago = (pago: Omit<Pago, 'id'>) => {
    const nuevoPago = {
      ...pago,
      id: crypto.randomUUID(),
    };
    setPagos([...pagos, nuevoPago]);
    setDialogOpen(false);
  };

  const handleDeletePago = (id: string) => {
    if (confirm('¿Está seguro de eliminar este pago?')) {
      setPagos(pagos.filter(p => p.id !== id));
    }
  };

  const handleGenerarReporte = () => {
    const now = new Date();
    const mesActual = now.toLocaleString('es-CR', { month: 'long', year: 'numeric' });
    
    const pagosMes = pagos.filter(p => {
      const pagoDate = new Date(p.fecha);
      return pagoDate.getMonth() === now.getMonth() && 
             pagoDate.getFullYear() === now.getFullYear();
    });
    
    const ingresoTotal = pagosMes.reduce((sum, p) => sum + p.monto, 0);
    
    let reporte = `==============================================\n`;
    reporte += `REPORTE DE INGRESOS - MASTERGYM\n`;
    reporte += `Poder y Pasión\n`;
    reporte += `==============================================\n\n`;
    reporte += `Periodo: ${mesActual}\n`;
    reporte += `Total de pagos: ${pagosMes.length}\n`;
    reporte += `Ingreso total: ${formatColones(ingresoTotal)}\n\n`;
    reporte += `DETALLE DE PAGOS:\n`;
    reporte += `${'='.repeat(100)}\n`;
    reporte += `${'Fecha'.padEnd(15)} | ${'Cliente'.padEnd(30)} | ${'Monto'.padEnd(15)} | ${'Método'.padEnd(15)} | ${'Tipo'.padEnd(15)}\n`;
    reporte += `${'-'.repeat(100)}\n`;
    
    pagosMes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).forEach(pago => {
      const cliente = clientes.find(c => c.id === pago.clienteId);
      const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido';
      reporte += `${new Date(pago.fecha).toLocaleDateString('es-CR').padEnd(15)} | ${nombreCliente.padEnd(30)} | ${formatColones(pago.monto).padEnd(15)} | ${pago.metodoPago.padEnd(15)} | ${pago.tipoPago.padEnd(15)}\n`;
    });
    
    reporte += `\n${'='.repeat(100)}\n`;
    reporte += `Reporte generado el ${new Date().toLocaleString('es-CR')}\n`;
    reporte += `==============================================\n`;
    
    const blob = new Blob([reporte], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ingresos-${now.getMonth() + 1}-${now.getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
  };

  const getTipoPagoBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'mensual':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'trimestral':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'semestral':
        return 'bg-orange-100 text-orange-900 border-orange-200';
      case 'anual':
        return 'bg-green-100 text-green-900 border-green-200';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  // Datos para gráfica de ingresos diarios del mes
  const now = new Date();
  const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ingresosPorDia = Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1;
    const ingresos = pagos
      .filter(p => {
        const pagoDate = new Date(p.fecha);
        return pagoDate.getMonth() === now.getMonth() && 
               pagoDate.getFullYear() === now.getFullYear() &&
               pagoDate.getDate() === dia;
      })
      .reduce((sum, p) => sum + p.monto, 0);
    
    return {
      dia: dia.toString(),
      ingresos,
    };
  }).filter(d => d.ingresos > 0);

  const ingresosMes = pagos
    .filter(p => {
      const pagoDate = new Date(p.fecha);
      return pagoDate.getMonth() === now.getMonth() && 
             pagoDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-6">
      {/* Gráfica de ingresos */}
      {ingresosPorDia.length > 0 && (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>
                  Ingresos del Mes
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {now.toLocaleString('es-CR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>
                  {formatColones(ingresosMes)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ingresosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="dia" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{ value: 'Día del mes', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `₡${value.toLocaleString('es-CR', { notation: 'compact' })}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [formatColones(value), 'Ingresos']}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Bar dataKey="ingresos" fill="url(#gradientBar)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5e62" />
                    <stop offset="100%" stopColor="#ff9966" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>Gestión de Pagos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Registro y control de ingresos</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleGenerarReporte}
                variant="outline"
                className="rounded-xl"
              >
                <Download className="mr-2 h-4 w-4" />
                Reporte de Ingresos
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={clientes.length === 0}
                    className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-black" style={{ fontSize: '1.5rem' }}>Nuevo Pago</DialogTitle>
                    <DialogDescription>
                      Registra un nuevo pago y renueva la membresía
                    </DialogDescription>
                  </DialogHeader>
                  <PagoForm 
                    onSubmit={handleAddPago}
                    onCancel={() => setDialogOpen(false)}
                    clientes={clientes}
                    setClientes={setClientes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">
                Primero debes agregar clientes para registrar pagos.
              </p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">
                No hay pagos registrados. Registra el primer pago.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Renovó hasta</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.slice().reverse().map((pago) => (
                    <TableRow key={pago.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-gray-900">
                          {getClienteNombre(pago.clienteId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(pago.fecha).toLocaleDateString('es-CR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoPagoBadgeClass(pago.tipoPago)} capitalize font-semibold`}>
                          {pago.tipoPago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-gray-900 font-semibold">{pago.metodoPago}</span>
                      </TableCell>
                      <TableCell>
                        {pago.referencia ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {pago.referencia}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pago.fechaVencimientoNueva ? (
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(pago.fechaVencimientoNueva).toLocaleDateString('es-CR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-lg text-[#ff5e62]">
                          {formatColones(pago.monto)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePago(pago.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
