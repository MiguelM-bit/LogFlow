import type { LoadRecord, LoadStatus } from "@/app/cargas/types/contracts";

interface LoadRow {
  id: string;
  status: LoadStatus;
  cliente: string | null;
  perfil: string | null;
  origin: string;
  horario_coleta: string | null;
  destination: string;
  horario_descarga: string | null;
  price: number | string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
}

export function mapLoadRow(row: LoadRow): LoadRecord {
  return {
    id: row.id,
    status: row.status,
    cliente: row.cliente,
    perfil: row.perfil,
    origin: row.origin,
    horarioColeta: row.horario_coleta,
    destination: row.destination,
    horarioDescarga: row.horario_descarga,
    price: Number(row.price ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
  };
}

export function mapLoadRows(rows: LoadRow[]): LoadRecord[] {
  return rows.map(mapLoadRow);
}
