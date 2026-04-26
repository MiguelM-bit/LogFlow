import { Motorista } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServiceResult } from "./types";

export async function listMotoristas(supabase: SupabaseClient): Promise<ServiceResult<Motorista[]>> {
  const { data, error } = await supabase
    .from("motoristas")
    .select("id, nome, cpf, telefone, status")
    .order("nome", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as Motorista[], error: null };
}

export async function createMotorista(
  supabase: SupabaseClient,
  input: Omit<Motorista, "id">
): Promise<ServiceResult<Motorista | null>> {
  const { data: existente, error: checkError } = await supabase
    .from("motoristas")
    .select("id")
    .eq("cpf", input.cpf)
    .limit(1);

  if (checkError) {
    return { data: null, error: checkError.message };
  }

  if ((existente ?? []).length > 0) {
    return { data: null, error: "Ja existe motorista cadastrado com este CPF." };
  }

  const { data, error } = await supabase
    .from("motoristas")
    .insert(input)
    .select("id, nome, cpf, telefone, status")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Motorista, error: null };
}
