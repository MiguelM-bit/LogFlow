import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DriverSummary,
  VehiclePreRegistrationInput,
  VehicleSummary,
} from "@/app/cargas/types/contracts";
import type { ServiceResult } from "@/services/types";

const DRIVERS_TABLE = "motoristas";
const VEHICLES_TABLE = "veiculos";

function normalizePlate(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isValidBrazilPlate(value: string): boolean {
  const plate = normalizePlate(value);
  const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return oldPattern.test(plate) || mercosulPattern.test(plate);
}

export async function searchDrivers(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<DriverSummary[]>> {
  const term = query.trim();

  if (term.length < 2) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from(DRIVERS_TABLE)
    .select("id, nome, cpf")
    .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%`)
    .order("nome", { ascending: true })
    .limit(10);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as Array<{ id: string; nome: string; cpf: string }>).map((row) => ({
      id: row.id,
      name: row.nome,
      cpf: row.cpf,
    })),
    error: null,
  };
}

export async function searchVehicles(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<VehicleSummary[]>> {
  const term = normalizePlate(query);

  if (term.length < 3) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .select("id, placa, tipo, categoria")
    .ilike("placa", `%${term}%`)
    .order("placa", { ascending: true })
    .limit(10);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as Array<{ id: string; placa: string; tipo: string; categoria: string }>).map((row) => ({
      id: row.id,
      plate: row.placa,
      type: row.tipo,
      category: row.categoria,
    })),
    error: null,
  };
}

export async function createOrGetVehicleByPlate(
  supabase: SupabaseClient,
  input: VehiclePreRegistrationInput
): Promise<ServiceResult<VehicleSummary | null>> {
  const normalizedPlate = normalizePlate(input.plate);

  if (!isValidBrazilPlate(normalizedPlate)) {
    return { data: null, error: "Placa inválida para pré-cadastro." };
  }

  const { data: existing, error: checkError } = await supabase
    .from(VEHICLES_TABLE)
    .select("id, placa, tipo, categoria")
    .eq("placa", normalizedPlate)
    .limit(1);

  if (checkError) {
    return { data: null, error: checkError.message };
  }

  if ((existing ?? []).length > 0) {
    const row = existing?.[0] as { id: string; placa: string; tipo: string; categoria: string };
    return {
      data: {
        id: row.id,
        plate: row.placa,
        type: row.tipo,
        category: row.categoria,
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .insert({
      placa: normalizedPlate,
      tipo: "Pre-cadastro",
      categoria: "Trator",
      proprietario_pj: null,
    })
    .select("id, placa, tipo, categoria")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as { id: string; placa: string; tipo: string; categoria: string };

  return {
    data: {
      id: row.id,
      plate: row.placa,
      type: row.tipo,
      category: row.categoria,
    },
    error: null,
  };
}
