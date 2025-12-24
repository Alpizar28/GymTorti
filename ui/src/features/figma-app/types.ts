export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: "activo" | "vencido" | "por-vencer" | "inactivo";
  tipoMembresia: "diario" | "mensual" | "trimestral" | "semestral" | "anual";
  foto?: string;
  contactoEmergencia?: string;
  observaciones?: string;
}

export type ClienteFormData = Pick<Cliente, "nombre" | "apellido" | "email" | "telefono" | "foto" | "contactoEmergencia" | "observaciones">;

export interface Pago {
  id: string;
  clienteId: string;
  monto: number;
  fecha: string;
  tipoPago: "diario" | "mensual" | "trimestral" | "semestral" | "anual";
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
