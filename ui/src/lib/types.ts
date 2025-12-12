export type ClientStatus = "ACTIVO" | "INACTIVO" | "MOROSO";

export type ClientResponse = {
  id: number;
  gymId: number;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado: ClientStatus;
  fechaRegistro: string;
  notas?: string | null;
};

export type ClientCreateRequest = {
  gymId: number;
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
