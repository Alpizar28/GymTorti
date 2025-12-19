import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Download, Mail, Phone, Calendar, CreditCard, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Cliente, Pago, Medicion } from '../App';

interface ClienteReporteDialogProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagos: Pago[];
  mediciones: Medicion[];
}

export function ClienteReporteDialog({ cliente, open, onOpenChange, pagos, mediciones }: ClienteReporteDialogProps) {
  const formatColones = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
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

  // Datos para gráfica de peso
  const dataPeso = mediciones
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map(m => ({
      fecha: new Date(m.fecha).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }),
      peso: m.peso,
    }));

  // Calcular totales
  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
  const ultimoPago = pagos.length > 0 
    ? pagos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null;

  const handleExportarReporte = () => {
    let reporte = `==============================================\n`;
    reporte += `REPORTE INDIVIDUAL - MASTERGYM\n`;
    reporte += `==============================================\n\n`;
    reporte += `DATOS PERSONALES\n`;
    reporte += `Nombre: ${cliente.nombre} ${cliente.apellido}\n`;
    reporte += `Correo: ${cliente.email}\n`;
    reporte += `Teléfono: ${cliente.telefono}\n`;
    reporte += `Estado: ${cliente.estado.toUpperCase()}\n\n`;
    
    reporte += `MEMBRESÍA\n`;
    reporte += `Tipo: ${cliente.tipoMembresia}\n`;
    reporte += `Fecha inicio: ${new Date(cliente.fechaInicio).toLocaleDateString('es-CR')}\n`;
    reporte += `Fecha vencimiento: ${new Date(cliente.fechaVencimiento).toLocaleDateString('es-CR')}\n\n`;
    
    if (cliente.contactoEmergencia) {
      reporte += `CONTACTO DE EMERGENCIA\n`;
      reporte += `${cliente.contactoEmergencia}\n\n`;
    }
    
    reporte += `HISTORIAL DE PAGOS (${pagos.length})\n`;
    reporte += `${'='.repeat(80)}\n`;
    pagos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).forEach(pago => {
      reporte += `${new Date(pago.fecha).toLocaleDateString('es-CR').padEnd(15)} | ${formatColones(pago.monto).padEnd(15)} | ${pago.metodoPago.padEnd(15)} | ${pago.tipoPago}\n`;
    });
    reporte += `\nTotal pagado: ${formatColones(totalPagado)}\n\n`;
    
    reporte += `HISTORIAL DE MEDICIONES (${mediciones.length})\n`;
    reporte += `${'='.repeat(80)}\n`;
    mediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).forEach(medicion => {
      const imc = (medicion.peso / Math.pow(medicion.altura / 100, 2)).toFixed(1);
      reporte += `${new Date(medicion.fecha).toLocaleDateString('es-CR').padEnd(15)} | Peso: ${medicion.peso}kg | Altura: ${medicion.altura}cm | IMC: ${imc}\n`;
    });
    
    if (cliente.observaciones) {
      reporte += `\nOBSERVACIONES\n`;
      reporte += `${cliente.observaciones}\n`;
    }
    
    reporte += `\n==============================================\n`;
    reporte += `Reporte generado el ${new Date().toLocaleString('es-CR')}\n`;
    reporte += `==============================================\n`;
    
    const blob = new Blob([reporte], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${cliente.nombre}-${cliente.apellido}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-black" style={{ fontSize: '1.5rem' }}>Reporte Individual</DialogTitle>
              <DialogDescription>
                Informe completo del cliente
              </DialogDescription>
            </div>
            <Button
              onClick={handleExportarReporte}
              className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Reporte
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con foto */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] rounded-2xl">
            {cliente.foto ? (
              <ImageWithFallback
                src={cliente.foto}
                alt={`${cliente.nombre} ${cliente.apellido}`}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] flex items-center justify-center text-white font-black shadow-lg" style={{ fontSize: '1.5rem' }}>
                {cliente.nombre[0]}{cliente.apellido[0]}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>
                {cliente.nombre} {cliente.apellido}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {getEstadoBadge(cliente.estado)}
                <Badge variant="secondary" className="bg-white text-gray-900 capitalize">
                  {cliente.tipoMembresia}
                </Badge>
              </div>
            </div>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#ff5e62]" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Correo</p>
                  <p className="font-semibold text-gray-900">{cliente.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="font-semibold text-gray-900">{cliente.telefono}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#ff5e62]" />
                  Membresía
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Inicio</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(cliente.fechaInicio).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vencimiento</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(cliente.fechaVencimiento).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historial de pagos */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#ff5e62]" />
                  Historial de Pagos
                </CardTitle>
                <Badge className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white">
                  {pagos.length} pago{pagos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Total pagado</p>
                    <p className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>{formatColones(totalPagado)}</p>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pagos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(pago => (
                      <div key={pago.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900">{formatColones(pago.monto)}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(pago.fecha).toLocaleDateString('es-CR')} · {pago.metodoPago} · {pago.tipoPago}
                          </p>
                        </div>
                        {pago.referencia && (
                          <Badge variant="outline" className="text-xs">
                            Ref: {pago.referencia}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mediciones y gráfica */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#ff5e62]" />
                  Evolución de Peso
                </CardTitle>
                <Badge className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white">
                  {mediciones.length} medición{mediciones.length !== 1 ? 'es' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {mediciones.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay mediciones registradas</p>
              ) : (
                <>
                  {dataPeso.length > 1 && (
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={dataPeso}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="fecha" 
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                            domain={['dataMin - 2', 'dataMax + 2']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'white', 
                              border: 'none', 
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value: number) => [`${value} kg`, 'Peso']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="peso" 
                            stroke="url(#gradientPeso)" 
                            strokeWidth={3}
                            dot={{ fill: '#ff5e62', r: 5 }}
                          />
                          <defs>
                            <linearGradient id="gradientPeso" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#ff5e62" />
                              <stop offset="100%" stopColor="#ff9966" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mediciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(medicion => {
                      const imc = (medicion.peso / Math.pow(medicion.altura / 100, 2)).toFixed(1);
                      return (
                        <div key={medicion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-900">{medicion.peso} kg · {medicion.altura} cm</p>
                            <p className="text-xs text-gray-600">
                              {new Date(medicion.fecha).toLocaleDateString('es-CR')} · IMC: {imc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          {cliente.observaciones && (
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{cliente.observaciones}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contacto de emergencia */}
          {cliente.contactoEmergencia && (
            <Card className="border-none shadow-md bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Contacto de Emergencia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-900 font-semibold">{cliente.contactoEmergencia}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
