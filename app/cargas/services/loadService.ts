import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateLoadDTO,
  ListLoadsFilters,
  LoadRecord,
  LoadStatus,
  UpdateLoadDTO,
} from "@/app/cargas/types/contracts";
import { mapLoadRows } from "@/app/cargas/utils/mappers";
import type { ServiceResult } from "@/services/types";

const LOADS_TABLE = "loads";

const LOADS_COLUMNS = "id, status, cliente, perfil, origin, horario_coleta, destination, horario_descarga, price, created_at, updated_at, created_by, driver_id, vehicle_id";

export async function listLoads(
  supabase: SupabaseClient,
  filters: ListLoadsFilters
): Promise<ServiceResult<LoadRecord[]>> {
  let query = supabase
    .from(LOADS_TABLE)
    .select(LOADS_COLUMNS)
    .order("horario_coleta", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.cliente?.trim()) {
    query = query.ilike("cliente", `%${filters.cliente.trim()}%`);
  }

  if (filters.perfil?.trim()) {
    query = query.ilike("perfil", `%${filters.perfil.trim()}%`);
  }

  if (filters.origin?.trim()) {
    query = query.ilike("origin", `%${filters.origin.trim()}%`);
  }

  if (filters.destination?.trim()) {
    query = query.ilike("destination", `%${filters.destination.trim()}%`);
  }

  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(/,/g, " ");
    query = query.or(`origin.ilike.%${escaped}%,destination.ilike.%${escaped}%,cliente.ilike.%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: mapLoadRows((data ?? []) as never[]), error: null };
}

export async function createLoad(
  supabase: SupabaseClient,
  input: CreateLoadDTO
): Promise<ServiceResult<LoadRecord | null>> {
  const payload = {
    status: input.status,
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    price: input.price,
    cliente: input.cliente?.trim() ?? null,
    perfil: input.perfil?.trim() ?? null,
    horario_coleta: input.horarioColeta ?? null,
    horario_descarga: input.horarioDescarga ?? null,
  };

  const { data, error } = await supabase
    .from(LOADS_TABLE)
    .insert(payload)
    .select(LOADS_COLUMNS)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapLoadRows([data as never])[0], error: null };
}

export async function updateLoad(
  supabase: SupabaseClient,
  loadId: string,
  input: UpdateLoadDTO
): Promise<ServiceResult<LoadRecord | null>> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.origin !== undefined) payload.origin = input.origin.trim();
  if (input.destination !== undefined) payload.destination = input.destination.trim();
  if (input.price !== undefined) payload.price = input.price;
  if (input.status !== undefined) payload.status = input.status;
  if (input.cliente !== undefined) payload.cliente = input.cliente?.trim() ?? null;
  if (input.perfil !== undefined) payload.perfil = input.perfil?.trim() ?? null;
  if (input.horarioColeta !== undefined) payload.horario_coleta = input.horarioColeta;
  if (input.horarioDescarga !== undefined) payload.horario_descarga = input.horarioDescarga;
  if (input.driverId !== undefined) payload.driver_id = input.driverId;
  if (input.vehicleId !== undefined) payload.vehicle_id = input.vehicleId;

  const { data, error } = await supabase
    .from(LOADS_TABLE)
    .update(payload)
    .eq("id", loadId)
    .select(LOADS_COLUMNS)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapLoadRows([data as never])[0], error: null };
}

export async function updateLoadStatus(
  supabase: SupabaseClient,
  loadId: string,
  nextStatus: LoadStatus,
  assignment?: { driverId?: string | null; vehicleId?: string | null }
): Promise<ServiceResult<LoadRecord | null>> {
  return await updateLoad(supabase, loadId, {
    status: nextStatus,
    ...(assignment?.driverId !== undefined ? { driverId: assignment.driverId } : {}),
    ...(assignment?.vehicleId !== undefined ? { vehicleId: assignment.vehicleId } : {}),
  });
}
