import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CadastroEndereco,
  CadastroRntrc,
  CadastroSearchItem,
  Empresa,
  EmpresaPayload,
} from "@/types";
import type { ServiceResult } from "./types";
import { formatCNPJ, normalizeDocument, validators } from "./validators";

interface EmpresaRow {
  id: string;
  cnpj: string;
  razao_social: string;
  status: "ativo" | "inativo" | "pendente";
  nome_fantasia: string | null;
  cnae: string | null;
  inscricao_estadual: string | null;
  atividade_fiscal: string | null;
  regime_tributario: string | null;
  modalidade: string | null;
  situacao: string | null;
  email: string | null;
  endereco_id: string;
  rntrc_id: string | null;
}

interface CadastroEnderecoRow extends CadastroEndereco {
  id: string;
}

interface CadastroRntrcRow extends CadastroRntrc {
  id: string;
}

interface EmpresaTelefoneRow {
  empresa_id: string;
  tipo: string | null;
  numero: string | null;
}

const ENDERECO_FALLBACK: CadastroEndereco = {
  tipo: "Comercial",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: null,
  bairro: "",
  municipio: "",
  uf: "",
};

async function upsertEndereco(
  supabase: SupabaseClient,
  endereco: CadastroEndereco,
  enderecoId?: string
): Promise<ServiceResult<string | null>> {
  if (enderecoId) {
    const { error } = await supabase.from("cad_enderecos").update(endereco).eq("id", enderecoId);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: enderecoId, error: null };
  }

  const { data, error } = await supabase.from("cad_enderecos").insert(endereco).select("id").single();
  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.id as string, error: null };
}

async function upsertRntrc(
  supabase: SupabaseClient,
  rntrc: CadastroRntrc | null,
  rntrcId?: string | null
): Promise<ServiceResult<string | null>> {
  if (!rntrc || !rntrc.numero.trim()) {
    if (rntrcId) {
      await supabase.from("cad_rntrc").delete().eq("id", rntrcId);
    }
    return { data: null, error: null };
  }

  if (rntrcId) {
    const { error } = await supabase.from("cad_rntrc").update(rntrc).eq("id", rntrcId);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: rntrcId, error: null };
  }

  const { data, error } = await supabase.from("cad_rntrc").insert(rntrc).select("id").single();
  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.id as string, error: null };
}

export async function searchEmpresas(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<CadastroSearchItem[]>> {
  const term = query.trim();

  if (!term) {
    return { data: [], error: null };
  }

  let request = supabase
    .from("cad_empresas")
    .select("id, cnpj, razao_social, status")
    .order("razao_social", { ascending: true });

  if (term !== "%") {
    request = request.or(`razao_social.ilike.%${term}%,cnpj.ilike.%${term}%`).limit(30);
  }

  const { data, error } = await request;

  if (error) {
    return { data: [], error: error.message };
  }

  const items: CadastroSearchItem[] = ((data ?? []) as EmpresaRow[]).map((row) => ({
    id: row.id,
    chave: formatCNPJ(row.cnpj),
    titulo: row.razao_social,
    subtitulo: null,
    status: row.status,
  }));

  return { data: items, error: null };
}

export async function isCnpjAlreadyRegistered(
  supabase: SupabaseClient,
  cnpj: string,
  excludeId?: string
): Promise<ServiceResult<boolean>> {
  const normalizedCnpj = normalizeDocument(cnpj);

  if (normalizedCnpj.length !== 14) {
    return { data: false, error: null };
  }

  let request = supabase
    .from("cad_empresas")
    .select("id", { count: "exact", head: true })
    .in("cnpj", [normalizedCnpj, formatCNPJ(normalizedCnpj)]);

  if (excludeId) {
    request = request.neq("id", excludeId);
  }

  const { count, error } = await request;

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: (count ?? 0) > 0, error: null };
}

export async function getEmpresaById(
  supabase: SupabaseClient,
  id: string
): Promise<ServiceResult<Empresa | null>> {
  const { data: empresaData, error: empresaError } = await supabase
    .from("cad_empresas")
    .select("*")
    .eq("id", id)
    .single();

  if (empresaError) {
    return { data: null, error: empresaError.message };
  }

  const empresa = empresaData as EmpresaRow;

  const [{ data: enderecoData }, { data: rntrcData }, { data: telefoneData }] = await Promise.all([
    supabase.from("cad_enderecos").select("*").eq("id", empresa.endereco_id).single(),
    empresa.rntrc_id ? supabase.from("cad_rntrc").select("*").eq("id", empresa.rntrc_id).single() : Promise.resolve({ data: null }),
    supabase.from("cad_empresas_telefones").select("*").eq("empresa_id", id).single(),
  ]);

  const endereco = (enderecoData as CadastroEnderecoRow | null) ?? null;
  const rntrc = (rntrcData as CadastroRntrcRow | null) ?? null;
  const telefone = (telefoneData as EmpresaTelefoneRow | null) ?? null;

  return {
    data: {
      id: empresa.id,
      cnpj: empresa.cnpj,
      razao_social: empresa.razao_social,
      status: empresa.status,
      nome_fantasia: empresa.nome_fantasia,
      cnae: empresa.cnae,
      inscricao_estadual: empresa.inscricao_estadual,
      atividade_fiscal: empresa.atividade_fiscal,
      regime_tributario: empresa.regime_tributario,
      modalidade: empresa.modalidade,
      situacao: empresa.situacao,
      email: empresa.email,
      endereco: endereco
        ? {
            tipo: endereco.tipo,
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            municipio: endereco.municipio,
            uf: endereco.uf,
          }
        : ENDERECO_FALLBACK,
      rntrc: rntrc
        ? {
            numero: rntrc.numero,
            data_emissao: rntrc.data_emissao,
            validade: rntrc.validade,
            tipo_transportador: rntrc.tipo_transportador,
          }
        : null,
      telefone_tipo: telefone?.tipo ?? null,
      telefone_numero: telefone?.numero ?? null,
    },
    error: null,
  };
}

export async function upsertEmpresa(
  supabase: SupabaseClient,
  input: { id?: string; data: EmpresaPayload }
): Promise<ServiceResult<Empresa | null>> {
  const normalizedCnpj = normalizeDocument(input.data.cnpj);

  if (!validators.cnpj(normalizedCnpj)) {
    return { data: null, error: "CNPJ inválido." };
  }

  const duplicateCnpj = await isCnpjAlreadyRegistered(supabase, normalizedCnpj, input.id);
  if (duplicateCnpj.error) {
    return { data: null, error: duplicateCnpj.error };
  }
  if (duplicateCnpj.data) {
    return { data: null, error: "Já existe um cadastro com este CPF/CNPJ" };
  }

  let enderecoId: string | undefined;
  let rntrcId: string | null | undefined;

  if (input.id) {
    const { data: current } = await supabase
      .from("cad_empresas")
      .select("endereco_id, rntrc_id")
      .eq("id", input.id)
      .single();

    if (current) {
      enderecoId = current.endereco_id as string;
      rntrcId = (current.rntrc_id as string | null) ?? null;
    }
  }

  const enderecoResult = await upsertEndereco(supabase, input.data.endereco, enderecoId);
  if (enderecoResult.error || !enderecoResult.data) {
    return { data: null, error: enderecoResult.error ?? "Falha ao salvar endereco." };
  }

  const rntrcResult = await upsertRntrc(supabase, input.data.rntrc, rntrcId);
  if (rntrcResult.error) {
    return { data: null, error: rntrcResult.error };
  }

  const empresaPayload = {
    cnpj: normalizedCnpj,
    razao_social: input.data.razao_social,
    status: input.data.status,
    nome_fantasia: input.data.nome_fantasia,
    cnae: input.data.cnae,
    inscricao_estadual: input.data.inscricao_estadual,
    atividade_fiscal: input.data.atividade_fiscal,
    regime_tributario: input.data.regime_tributario,
    modalidade: input.data.modalidade,
    situacao: input.data.situacao,
    email: input.data.email,
    endereco_id: enderecoResult.data,
    rntrc_id: rntrcResult.data,
  };

  let empresaId = input.id;

  if (input.id) {
    const { error } = await supabase.from("cad_empresas").update(empresaPayload).eq("id", input.id);
    if (error) {
      return { data: null, error: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("cad_empresas")
      .insert(empresaPayload)
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    empresaId = data.id as string;
  }

  if (!empresaId) {
    return { data: null, error: "Empresa nao localizada apos gravacao." };
  }

  const { error: telefoneError } = await supabase.from("cad_empresas_telefones").upsert(
    {
      empresa_id: empresaId,
      tipo: input.data.telefone_tipo,
      numero: input.data.telefone_numero,
    },
    { onConflict: "empresa_id" }
  );

  if (telefoneError) {
    return { data: null, error: telefoneError.message };
  }

  return getEmpresaById(supabase, empresaId);
}
