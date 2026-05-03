export type LoadStatus = "em_aberto" | "em_negociacao" | "fechada" | "cancelada";

export interface LoadRecord {
  id: string;
  status: LoadStatus;
  origin: string;
  destination: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  driverId: string | null;
  vehicleId: string | null;
}

export interface CreateLoadDTO {
  origin: string;
  destination: string;
  price: number;
  status: LoadStatus;
}

export interface UpdateLoadDTO {
  origin?: string;
  destination?: string;
  price?: number;
  status?: LoadStatus;
  driverId?: string | null;
  vehicleId?: string | null;
}

export interface ListLoadsFilters {
  status?: LoadStatus;
  search?: string;
}

export interface DriverPreRegistrationInput {
  name: string;
  cpf: string;
}

export interface DriverSummary {
  id: string;
  name: string;
  cpf: string;
}

export interface VehicleSummary {
  id: string;
  plate: string;
  type: string;
  category: string;
}

export interface VehiclePreRegistrationInput {
  plate: string;
}

export interface CloseLoadAssignmentInput {
  driverId?: string;
  vehicleId?: string;
  preDriver?: DriverPreRegistrationInput;
  preVehicle?: VehiclePreRegistrationInput;
}
