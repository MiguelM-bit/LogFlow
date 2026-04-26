import { Composicao, ComposicaoFull, HistoricoComposicao, Motorista, Veiculo } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServiceResult } from "./types";

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function listComposicoes(supabase: SupabaseClient): Promise<ServiceResult<Composicao[]>> {
  const { data, error } = await supabase
    .from("composicoes")
    .select("id, motorista_id, cavalo_id, carreta_id, ativo, data_engate, local_engate, data_desengate, local_desengate")
    .order("id", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const composicoes = (data ?? []) as Composicao[];
  const motoristaIds = uniqueIds(composicoes.map((item) => item.motorista_id));
  const vehicleIds = uniqueIds(composicoes.flatMap((item) => [item.cavalo_id, item.carreta_id]));

  const [{ data: motoristasData }, { data: veiculosData }] = await Promise.all([
    motoristaIds.length
      ? supabase
          .from("motoristas")
          .select("id, nome, telefone")
          .in("id", motoristaIds)
      : Promise.resolve({ data: [] as Partial<Motorista>[], error: null }),
    vehicleIds.length
      ? supabase
          .from("veiculos")
          .select("id, placa, categoria")
          .in("id", vehicleIds)
      : Promise.resolve({ data: [] as Partial<Veiculo>[], error: null }),
  ]);

  const motoristasMap = new Map((motoristasData ?? []).map((item) => [item.id, item]));
  const veiculosMap = new Map((veiculosData ?? []).map((item) => [item.id, item]));

  const enriched = composicoes.map((item) => ({
    ...item,
    motorista: motoristasMap.get(item.motorista_id)
      ? {
          id: item.motorista_id,
          nome: motoristasMap.get(item.motorista_id)?.nome ?? "-",
          telefone: motoristasMap.get(item.motorista_id)?.telefone ?? "",
        }
      : null,
    cavalo: veiculosMap.get(item.cavalo_id)
      ? {
          id: item.cavalo_id,
          placa: veiculosMap.get(item.cavalo_id)?.placa ?? "-",
          categoria: veiculosMap.get(item.cavalo_id)?.categoria ?? "",
        }
      : null,
    carreta: veiculosMap.get(item.carreta_id)
      ? {
          id: item.carreta_id,
          placa: veiculosMap.get(item.carreta_id)?.placa ?? "-",
          categoria: veiculosMap.get(item.carreta_id)?.categoria ?? "",
        }
      : null,
  }));

  return { data: enriched as ComposicaoFull[], error: null };
}

export async function listComposicoesAtivas(supabase: SupabaseClient): Promise<ServiceResult<Composicao[]>> {
  const { data, error } = await listComposicoes(supabase);

  if (error) {
    return { data: [], error };
  }

  return { data: data.filter((item) => item.ativo), error: null };
}

export async function createComposicao(
  supabase: SupabaseClient,
  input: { motorista_id: string; cavalo_id: string; carreta_id: string; data_engate?: string; local_engate?: string }
): Promise<ServiceResult<Composicao | null>> {
  if (input.cavalo_id === input.carreta_id) {
    return {
      data: null,
      error: "Cavalo e carreta nao podem ser o mesmo veiculo.",
    };
  }

  const { data: active, error: activeError } = await supabase
    .from("composicoes")
    .select("id, motorista_id, cavalo_id, carreta_id")
    .eq("ativo", true);

  if (activeError) {
    return { data: null, error: activeError.message };
  }

  const conflict = (active ?? []).find(
    (item) =>
      item.motorista_id === input.motorista_id ||
      item.cavalo_id === input.cavalo_id ||
      item.carreta_id === input.carreta_id
  );

  if (conflict) {
    return {
      data: null,
      error: "Motorista, cavalo ou carreta ja estao vinculados a outra composicao ativa.",
    };
  }

  const { data, error } = await supabase
    .from("composicoes")
    .insert({ ...input, ativo: true })
    .select("id, motorista_id, cavalo_id, carreta_id, ativo, data_engate, local_engate, data_desengate, local_desengate")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Composicao, error: null };
}

export async function updateComposicao(
  supabase: SupabaseClient,
  input: { id: string; motorista_id: string; cavalo_id: string; carreta_id: string }
): Promise<ServiceResult<boolean>> {
  if (input.cavalo_id === input.carreta_id) {
    return {
      data: false,
      error: "Cavalo e carreta nao podem ser o mesmo veiculo.",
    };
  }

  const { data: active, error: activeError } = await supabase
    .from("composicoes")
    .select("id, motorista_id, cavalo_id, carreta_id")
    .eq("ativo", true)
    .neq("id", input.id);

  if (activeError) {
    return { data: false, error: activeError.message };
  }

  const conflict = (active ?? []).find(
    (item) =>
      item.motorista_id === input.motorista_id ||
      item.cavalo_id === input.cavalo_id ||
      item.carreta_id === input.carreta_id
  );

  if (conflict) {
    return {
      data: false,
      error: "Motorista, cavalo ou carreta ja estao vinculados a outra composicao ativa.",
    };
  }

  const { error } = await supabase
    .from("composicoes")
    .update({
      motorista_id: input.motorista_id,
      cavalo_id: input.cavalo_id,
      carreta_id: input.carreta_id,
    })
    .eq("id", input.id);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export async function deactivateComposicao(
  supabase: SupabaseClient,
  input: { id: string }
): Promise<ServiceResult<boolean>> {
  const { data: viagens, error: viagensError } = await supabase
    .from("cargas")
    .select("id")
    .eq("composicao_id", input.id)
    .or("status.is.null,status.neq.concluida")
    .limit(1);

  if (viagensError) {
    return { data: false, error: viagensError.message };
  }

  if ((viagens ?? []).length > 0) {
    return {
      data: false,
      error: "Esta composicao possui viagem em andamento. Acesse a pagina /programacao para remover a composicao da viagem antes de desativá-la.",
    };
  }

  const { error } = await supabase
    .from("composicoes")
    .update({ ativo: false })
    .eq("id", input.id);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export async function engateComposicao(
  supabase: SupabaseClient,
  input: { id: string; data_engate: string; local_engate: string }
): Promise<ServiceResult<boolean>> {
  const { error } = await supabase
    .from("composicoes")
    .update({ data_engate: input.data_engate, local_engate: input.local_engate, data_desengate: null, local_desengate: null, ativo: true })
    .eq("id", input.id);

  if (error) return { data: false, error: error.message };

  await supabase.from("historico_composicoes").insert({
    composicao_id: input.id,
    evento: "engate",
    local: input.local_engate,
    observacao: null,
  }).then(() => null, () => null); // histórico é best-effort

  return { data: true, error: null };
}

export async function desengateComposicao(
  supabase: SupabaseClient,
  input: { id: string; data_desengate: string; local_desengate: string }
): Promise<ServiceResult<boolean>> {
  // Verificar viagens abertas
  const { data: viagens } = await supabase
    .from("cargas")
    .select("id")
    .eq("composicao_id", input.id)
    .or("status.is.null,status.neq.concluida")
    .limit(1);

  if ((viagens ?? []).length > 0) {
    return {
      data: false,
      error: "Esta composicao esta vinculada a uma viagem em andamento. Acesse /programacao para remover a composicao da viagem antes de desengatar.",
    };
  }

  const { error } = await supabase
    .from("composicoes")
    .update({ data_desengate: input.data_desengate, local_desengate: input.local_desengate, ativo: false })
    .eq("id", input.id);

  if (error) return { data: false, error: error.message };

  await supabase.from("historico_composicoes").insert({
    composicao_id: input.id,
    evento: "desengate",
    local: input.local_desengate,
    observacao: null,
  }).then(() => null, () => null);

  return { data: true, error: null };
}

export async function trocarMotoristaComposicao(
  supabase: SupabaseClient,
  input: { id: string; motorista_id: string }
): Promise<ServiceResult<boolean>> {
  const { data: active } = await supabase
    .from("composicoes")
    .select("id")
    .eq("ativo", true)
    .eq("motorista_id", input.motorista_id)
    .neq("id", input.id)
    .limit(1);

  if ((active ?? []).length > 0) {
    return {
      data: false,
      error: "Este motorista ja esta em outra composicao ativa. Acesse /composicoes para desativa-la primeiro.",
    };
  }

  const { error } = await supabase
    .from("composicoes")
    .update({ motorista_id: input.motorista_id })
    .eq("id", input.id);

  if (error) return { data: false, error: error.message };

  await supabase.from("historico_composicoes").insert({
    composicao_id: input.id,
    motorista_id: input.motorista_id,
    evento: "troca_motorista",
  }).then(() => null, () => null);

  return { data: true, error: null };
}

export async function trocarVeiculoComposicao(
  supabase: SupabaseClient,
  input: { id: string; tipo: "cavalo" | "carreta"; veiculo_id: string }
): Promise<ServiceResult<boolean>> {
  const campo = input.tipo === "cavalo" ? "cavalo_id" : "carreta_id";

  const { data: active } = await supabase
    .from("composicoes")
    .select("id")
    .eq("ativo", true)
    .eq(campo, input.veiculo_id)
    .neq("id", input.id)
    .limit(1);

  if ((active ?? []).length > 0) {
    return {
      data: false,
      error: `Este veiculo ja esta em outra composicao ativa. Acesse /composicoes para resolver o conflito.`,
    };
  }

  const { error } = await supabase
    .from("composicoes")
    .update({ [campo]: input.veiculo_id })
    .eq("id", input.id);

  if (error) return { data: false, error: error.message };

  await supabase.from("historico_composicoes").insert({
    composicao_id: input.id,
    [input.tipo === "cavalo" ? "cavalo_id" : "carreta_id"]: input.veiculo_id,
    evento: "troca_veiculo",
  }).then(() => null, () => null);

  return { data: true, error: null };
}

export async function listHistoricoComposicao(
  supabase: SupabaseClient,
  composicaoId: string
): Promise<ServiceResult<HistoricoComposicao[]>> {
  const { data, error } = await supabase
    .from("historico_composicoes")
    .select("*")
    .eq("composicao_id", composicaoId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as HistoricoComposicao[], error: null };
}
