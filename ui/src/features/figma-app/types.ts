export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  email: string;
  telefono: string;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: "activo" | "vencido" | "por-vencer" | "inactivo";
  tipoMembresia: "diario" | "mensual" | "pareja" | "universidad" | "colegio";
  contactoEmergencia?: string;
  observaciones?: string;
}

export type ClienteFormData = {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefonoCodigo: string;
  telefonoNumero: string;
  contactoEmergencia?: string;
  observaciones?: string;
};

export interface Pago {
  id: string;
  clienteId: string;
  monto: number;
  fecha: string;
  tipoPago: "diario" | "mensual" | "pareja" | "universidad" | "colegio";
  metodoPago: "efectivo" | "tarjeta" | "sinpe";
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
