export type MembershipType = "mensual" | "trimestral" | "semestral" | "anual";
export type ClientState = "activo" | "vencido" | "por-vencer" | "inactivo";

export type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: ClientState;
  tipoMembresia: MembershipType;
  foto?: string;
  contactoEmergencia?: string;
  observaciones?: string;
};

export type PaymentMethod = "efectivo" | "tarjeta" | "sinpe";

export type Pago = {
  id: string;
  clienteId: string;
  monto: number;
  fecha: string;
  tipoPago: MembershipType;
  metodoPago: PaymentMethod;
  referencia?: string;
  fechaVencimientoAnterior?: string;
  fechaVencimientoNueva?: string;
};

export type Medicion = {
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
};

