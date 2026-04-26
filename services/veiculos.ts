import { Veiculo } from "@/types";
import type {
  CadastroSearchItem,
  Empresa,
  VeiculoCadastro,
  VeiculoCadastroPayload,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServiceResult } from "./types";

export async function listVeiculos(supabase: SupabaseClient): Promise<ServiceResult<Veiculo[]>> {
  const { data, error } = await supabase
    .from("veiculos")
    .select("id, placa, tipo, categoria, proprietario_pj")
    .order("placa", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as Veiculo[], error: null };
}

export async function createVeiculo(
  supabase: SupabaseClient,
  input: Omit<Veiculo, "id">
): Promise<ServiceResult<Veiculo | null>> {
  const placa = input.placa.trim().toUpperCase();

  const { data: existente, error: checkError } = await supabase
    .from("veiculos")
    .select("id")
    .eq("placa", placa)
    .limit(1);

  if (checkError) {
    return { data: null, error: checkError.message };
  }

  if ((existente ?? []).length > 0) {
    return { data: null, error: "Ja existe veiculo cadastrado com esta placa." };
  }

  const { data, error } = await supabase
    .from("veiculos")
    .insert({ ...input, placa })
    .select("id, placa, tipo, categoria, proprietario_pj")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Veiculo, error: null };
}

export async function searchVeiculosCadastro(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<CadastroSearchItem[]>> {
  const term = query.trim().toUpperCase();

  if (!term) {
    return { data: [], error: null };
  }

  let request = supabase
    .from("cad_veiculos")
    .select("id, placa, marca, modelo, status")
    .order("placa", { ascending: true });

  if (term !== "%") {
    request = request.or(`placa.ilike.%${term}%,marca.ilike.%${term}%,modelo.ilike.%${term}%`).limit(30);
  }

  const { data, error } = await request;

  if (error) {
    return { data: [], error: error.message };
  }

  const result: CadastroSearchItem[] = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    chave: String(row.placa ?? ""),
    titulo: String(row.placa ?? ""),
    subtitulo: [row.marca, row.modelo].filter(Boolean).join(" ") || null,
    status: (row.status as CadastroSearchItem["status"]) ?? "ativo",
  }));

  return { data: result, error: null };
}

export async function getVeiculoCadastroById(
  supabase: SupabaseClient,
  id: string
): Promise<ServiceResult<VeiculoCadastro | null>> {
  const { data, error } = await supabase
    .from("cad_veiculos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as Record<string, unknown>;

  return {
    data: {
      id: String(row.id),
      placa: String(row.placa ?? ""),
      status: (row.status as VeiculoCadastro["status"]) ?? "ativo",
      renavam: (row.renavam as string | null) ?? null,
      chassis: (row.chassis as string | null) ?? null,
      ano: (row.ano as number | null) ?? null,
      cor: (row.cor as string | null) ?? null,
      municipio: (row.municipio as string | null) ?? null,
      marca: (row.marca as string | null) ?? null,
      modelo: (row.modelo as string | null) ?? null,
      agrupamento: (row.agrupamento as string | null) ?? null,
      classificacao: (row.classificacao as string | null) ?? null,
      modalidade: (row.modalidade as string | null) ?? null,
      situacao: (row.situacao as string | null) ?? null,
      proprietario_empresa_id: (row.proprietario_empresa_id as string | null) ?? null,
      proprietario_cnpj_documento: (row.proprietario_cnpj_documento as string | null) ?? null,
    },
    error: null,
  };
}

export async function upsertVeiculoCadastro(
  supabase: SupabaseClient,
  input: { id?: string; data: VeiculoCadastroPayload }
): Promise<ServiceResult<VeiculoCadastro | null>> {
  const payload = {
    placa: input.data.placa.trim().toUpperCase(),
    status: input.data.status,
    renavam: input.data.renavam,
    chassis: input.data.chassis,
    ano: input.data.ano,
    cor: input.data.cor,
    municipio: input.data.municipio,
    marca: input.data.marca,
    modelo: input.data.modelo,
    agrupamento: input.data.agrupamento,
    classificacao: input.data.classificacao,
    modalidade: input.data.modalidade,
    situacao: input.data.situacao,
    proprietario_empresa_id: input.data.proprietario_empresa_id,
    proprietario_cnpj_documento: input.data.proprietario_cnpj_documento,
  };

  let id = input.id;

  if (input.id) {
    const { error } = await supabase.from("cad_veiculos").update(payload).eq("id", input.id);
    if (error) {
      return { data: null, error: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("cad_veiculos")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    id = data.id as string;
  }

  if (!id) {
    return { data: null, error: "Veiculo nao localizado apos gravacao." };
  }

  return getVeiculoCadastroById(supabase, id);
}

export async function listEmpresasForOwnerSelect(
  supabase: SupabaseClient
): Promise<ServiceResult<Array<Pick<Empresa, "id" | "cnpj" | "razao_social" | "modalidade">>>> {
  const { data, error } = await supabase
    .from("cad_empresas")
    .select("id, cnpj, razao_social, modalidade")
    .order("razao_social", { ascending: true })
    .limit(200);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      cnpj: String(row.cnpj ?? ""),
      razao_social: String(row.razao_social ?? ""),
      modalidade: (row.modalidade as string | null) ?? null,
    })),
    error: null,
  };
}
