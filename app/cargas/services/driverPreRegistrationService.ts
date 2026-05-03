import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCPF, normalizeDocument, validators } from "@/services/validators";
import type { DriverPreRegistrationInput, DriverSummary } from "@/app/cargas/types/contracts";
import type { ServiceResult } from "@/services/types";

const DRIVERS_TABLE = "motoristas";

function toDriverSummary(row: { id: string; nome: string; cpf: string }): DriverSummary {
  return {
    id: row.id,
    name: row.nome,
    cpf: row.cpf,
  };
}

export async function createOrGetPreRegisteredDriver(
  supabase: SupabaseClient,
  input: DriverPreRegistrationInput
): Promise<ServiceResult<DriverSummary | null>> {
  const normalizedCpf = normalizeDocument(input.cpf);

  if (!validators.cpf(normalizedCpf)) {
    return { data: null, error: "CPF inválido para pré-cadastro." };
  }

  const cpfVariants = [normalizedCpf, formatCPF(normalizedCpf)];

  const { data: existing, error: existingError } = await supabase
    .from(DRIVERS_TABLE)
    .select("id, nome, cpf")
    .in("cpf", cpfVariants)
    .limit(1);

  if (existingError) {
    return { data: null, error: existingError.message };
  }

  if ((existing ?? []).length > 0) {
    const current = existing?.[0];
    return {
      data: toDriverSummary(current as { id: string; nome: string; cpf: string }),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from(DRIVERS_TABLE)
    .insert({
      nome: input.name.trim(),
      cpf: normalizedCpf,
      telefone: null,
      status: "ativo",
      is_pre_registered: true,
      incomplete_profile: true,
      updated_at: new Date().toISOString(),
    })
    .select("id, nome, cpf")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: toDriverSummary(data as { id: string; nome: string; cpf: string }),
    error: null,
  };
}
