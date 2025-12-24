export type ClientStatus = "ACTIVO" | "INACTIVO" | "MOROSO";

export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PaymentCurrency = "CRC" | "USD";
export type PaymentMethod = "CASH" | "SINPE" | "CARD" | "TRANSFER" | "OTHER";
export type PaymentType =
  | "DAILY_MEMBERSHIP"
  | "MONTHLY_MEMBERSHIP"
  | "QUARTERLY_MEMBERSHIP"
  | "SEMESTER_MEMBERSHIP"
  | "ANNUAL_MEMBERSHIP"
  | "REGISTRATION"
  | "PENALTY"
  | "OTHER";
export type PaymentStatus = "PAID" | "PENDING" | "CANCELLED" | "REFUNDED";

export type PaymentResponse = {
  id: number;
  gymId: number;
  clientId: number;
  amount: string;
  currency: PaymentCurrency;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentCreateRequest = {
  clientId: number;
  amount: string;
  currency?: PaymentCurrency;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status?: PaymentStatus;
  reference?: string;
  notes?: string;
  paymentDate: string;
};

export type PaymentUpdateRequest = {
  clientId?: number | null;
  amount?: string | null;
  currency?: PaymentCurrency | null;
  paymentMethod?: PaymentMethod | null;
  paymentType?: PaymentType | null;
  status?: PaymentStatus | null;
  reference?: string | null;
  notes?: string | null;
  paymentDate?: string | null;
};

export type ClientResponse = {
  id: number;
  gymId: number;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado: ClientStatus;
  fechaRegistro: string;
  fechaInicioMembresia?: string | null;
  fechaVencimiento?: string | null;
  notas?: string | null;
};

export type ClientCreateRequest = {
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  notas?: string;
};

export type ClientUpdateRequest = {
  nombre?: string | null;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  estado?: ClientStatus | null;
};
