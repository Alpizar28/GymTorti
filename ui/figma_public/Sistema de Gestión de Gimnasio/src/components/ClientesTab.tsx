import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Pencil, Trash2, RefreshCw, Bell, FileText, BarChart3 } from 'lucide-react';
import { ClienteForm } from './ClienteForm';
import { ClienteDetailDialog } from './ClienteDetailDialog';
import { ClienteReporteDialog } from './ClienteReporteDialog';
import type { Cliente, Pago, Medicion } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ClientesTabProps {
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  allClientes: Cliente[];
  pagos: Pago[];
  mediciones: Medicion[];
}

export function ClientesTab({ clientes, setClientes, allClientes, pagos, mediciones }: ClientesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'vencidos' | 'por-vencer'>('todos');

  const handleAddCliente = (cliente: Omit<Cliente, 'id'>) => {
    const nuevoCliente = {
      ...cliente,
      id: crypto.randomUUID(),
    };
    setClientes([...allClientes, nuevoCliente]);
    setDialogOpen(false);
  };

  const handleEditCliente = (cliente: Omit<Cliente, 'id'>) => {
    if (editingCliente) {
      setClientes(
        allClientes.map(c => 
          c.id === editingCliente.id ? { ...cliente, id: editingCliente.id } : c
        )
      );
      setEditingCliente(null);
      setDialogOpen(false);
    }
  };

  const handleDeleteCliente = (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      setClientes(allClientes.filter(c => c.id !== id));
    }
  };

  const handleRenovarMembresia = (clienteId: string) => {
    const cliente = allClientes.find(c => c.id === clienteId);
    if (!cliente) return;

    const mesesMap = {
      mensual: 1,
      trimestral: 3,
      semestral: 6,
      anual: 12,
    };

    const hoy = new Date();
    const vencimientoActual = new Date(cliente.fechaVencimiento);
    const fechaBase = vencimientoActual > hoy ? vencimientoActual : hoy;
    
    const nuevaFechaVencimiento = new Date(fechaBase);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + mesesMap[cliente.tipoMembresia]);

    setClientes(
      allClientes.map(c =>
        c.id === clienteId
          ? { ...c, fechaVencimiento: nuevaFechaVencimiento.toISOString().split('T')[0], estado: 'activo' as const }
          : c
      )
    );
    
    alert('Membresía renovada exitosamente');
  };

  const handleEnviarRecordatorio = (clienteId: string) => {
    const cliente = allClientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    alert(`Recordatorio enviado a ${cliente.nombre} ${cliente.apellido}\nTeléfono: ${cliente.telefono}\nCorreo: ${cliente.email}`);
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const openDetailDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDetailDialogOpen(true);
  };

  const openReporteDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setReporteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCliente(null);
  };

  const getEstadoBadge = (estado: Cliente['estado'], fechaVencimiento: string) => {
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500 text-white border-none hover:bg-green-600">Activo</Badge>;
      case 'por-vencer':
        return <Badge className="bg-yellow-500 text-white border-none hover:bg-yellow-600">Por vencer ({diasParaVencer}d)</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500 text-white border-none hover:bg-red-600">Vencido</Badge>;
      case 'inactivo':
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filter === 'activos') return c.estado === 'activo';
    if (filter === 'vencidos') return c.estado === 'vencido';
    if (filter === 'por-vencer') return c.estado === 'por-vencer';
    return true;
  });

  return (
    <>
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-black text-gray-900" style={{ fontSize: '1.5rem' }}>Gestión de Clientes</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Administra la información de tus miembros</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('todos')}
                  className={filter === 'todos' ? 'bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl' : 'rounded-xl'}
                >
                  Todos ({clientes.length})
                </Button>
                <Button
                  variant={filter === 'activos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('activos')}
                  className={filter === 'activos' ? 'bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl' : 'rounded-xl'}
                >
                  Activos ({clientes.filter(c => c.estado === 'activo').length})
                </Button>
                <Button
                  variant={filter === 'por-vencer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('por-vencer')}
                  className={filter === 'por-vencer' ? 'bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl' : 'rounded-xl'}
                >
                  Por vencer ({clientes.filter(c => c.estado === 'por-vencer').length})
                </Button>
                <Button
                  variant={filter === 'vencidos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('vencidos')}
                  className={filter === 'vencidos' ? 'bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white rounded-xl' : 'rounded-xl'}
                >
                  Vencidos ({clientes.filter(c => c.estado === 'vencido').length})
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setEditingCliente(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#ff5e62] to-[#ff9966] text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-black" style={{ fontSize: '1.5rem' }}>
                      {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCliente 
                        ? 'Modifica la información del cliente' 
                        : 'Ingresa los datos del nuevo miembro'}
                    </DialogDescription>
                  </DialogHeader>
                  <ClienteForm 
                    onSubmit={editingCliente ? handleEditCliente : handleAddCliente}
                    initialData={editingCliente || undefined}
                    onCancel={closeDialog}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff5e62] to-[#ff9966] rounded-2xl mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-500 text-lg">
                {filter === 'todos' 
                  ? 'No hay clientes registrados. Agrega tu primer miembro.' 
                  : `No hay clientes ${filter}.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="rounded-tl-3xl">Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Membresía</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right rounded-tr-3xl">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cliente.foto ? (
                            <ImageWithFallback
                              src={cliente.foto}
                              alt={`${cliente.nombre} ${cliente.apellido}`}
                              className="w-12 h-12 rounded-xl object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff5e62] to-[#ff9966] flex items-center justify-center text-white font-bold shadow-md">
                              {cliente.nombre[0]}{cliente.apellido[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900">
                              {cliente.nombre} {cliente.apellido}
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => openDetailDialog(cliente)}
                                className="text-xs text-[#ff5e62] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <FileText className="h-3 w-3" />
                                Ver Cliente
                              </button>
                              <button
                                onClick={() => openReporteDialog(cliente)}
                                className="text-xs text-[#ff9966] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <BarChart3 className="h-3 w-3" />
                                Reporte
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900 font-semibold">{cliente.telefono}</div>
                          <div className="text-gray-500">{cliente.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-[#ffe5e6] to-[#ffe5cc] text-gray-900 border-none font-semibold capitalize"
                        >
                          {cliente.tipoMembresia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(cliente.fechaVencimiento).toLocaleDateString('es-CR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(cliente.estado, cliente.fechaVencimiento)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(cliente.estado === 'vencido' || cliente.estado === 'por-vencer') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRenovarMembresia(cliente.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl"
                              title="Renovar membresía"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnviarRecordatorio(cliente.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                            title="Enviar recordatorio"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(cliente)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCliente(cliente.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCliente && (
        <>
          <ClienteDetailDialog
            cliente={selectedCliente}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
          />
          <ClienteReporteDialog
            cliente={selectedCliente}
            open={reporteDialogOpen}
            onOpenChange={setReporteDialogOpen}
            pagos={pagos.filter(p => p.clienteId === selectedCliente.id)}
            mediciones={mediciones.filter(m => m.clienteId === selectedCliente.id)}
          />
        </>
      )}
    </>
  );
}
