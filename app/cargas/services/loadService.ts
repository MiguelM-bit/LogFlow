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

export async function listLoads(
  supabase: SupabaseClient,
  filters: ListLoadsFilters
): Promise<ServiceResult<LoadRecord[]>> {
  let query = supabase
    .from(LOADS_TABLE)
    .select("id, status, origin, destination, price, created_at, updated_at, created_by, driver_id")
    .order("updated_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(/,/g, " ");
    query = query.or(`origin.ilike.%${escaped}%,destination.ilike.%${escaped}%`);
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
  };

  const { data, error } = await supabase
    .from(LOADS_TABLE)
    .insert(payload)
    .select("id, status, origin, destination, price, created_at, updated_at, created_by, driver_id")
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
  if (input.driverId !== undefined) payload.driver_id = input.driverId;

  const { data, error } = await supabase
    .from(LOADS_TABLE)
    .update(payload)
    .eq("id", loadId)
    .select("id, status, origin, destination, price, created_at, updated_at, created_by, driver_id")
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
  driverId?: string | null
): Promise<ServiceResult<LoadRecord | null>> {
  return await updateLoad(supabase, loadId, {
    status: nextStatus,
    ...(driverId !== undefined ? { driverId } : {}),
  });
}
