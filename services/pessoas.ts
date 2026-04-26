import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CadastroEndereco,
  CadastroRntrc,
  CadastroSearchItem,
  PessoaFisica,
  PessoaFisicaPayload,
} from "@/types";
import type { ServiceResult } from "./types";
import { formatCPF, normalizeDocument, validators } from "./validators";

interface PessoaFisicaRow {
  id: string;
  cpf: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  status: "ativo" | "inativo" | "pendente";
  nacionalidade: string | null;
  naturalidade: string | null;
  grau_instrucao: string | null;
  estado_civil: string | null;
  raca_cor: string | null;
  modalidade: string | null;
  situacao: string | null;
  email: string | null;
  filiacao_pai: string | null;
  filiacao_mae: string | null;
  endereco_id: string;
  rntrc_id: string | null;
}

interface PessoaFisicaDocumentosRow {
  pessoa_fisica_id: string;
  rg_numero: string | null;
  rg_orgao_expedidor: string | null;
  rg_uf: string | null;
  rg_data_emissao: string | null;
  cnh_numero: string | null;
  cnh_registro: string | null;
  cnh_codigo_seguranca: string | null;
  cnh_renach: string | null;
  cnh_data_primeira_habilitacao: string | null;
  cnh_data_emissao: string | null;
  cnh_validade: string | null;
  cnh_uf: string | null;
  cnh_categoria: string | null;
  cnh_orgao_emissor: string | null;
}

interface CadastroEnderecoRow extends CadastroEndereco {
  id: string;
}

interface CadastroRntrcRow extends CadastroRntrc {
  id: string;
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

function toSearchItem(row: PessoaFisicaRow): CadastroSearchItem {
  return {
    id: row.id,
    chave: formatCPF(row.cpf),
    titulo: row.nome,
    subtitulo: row.telefone,
    status: row.status,
  };
}

export async function isCpfAlreadyRegistered(
  supabase: SupabaseClient,
  cpf: string,
  excludeId?: string
): Promise<ServiceResult<boolean>> {
  const normalizedCpf = normalizeDocument(cpf);

  if (normalizedCpf.length !== 11) {
    return { data: false, error: null };
  }

  let request = supabase
    .from("cad_pessoas_fisicas")
    .select("id", { count: "exact", head: true })
    .in("cpf", [normalizedCpf, formatCPF(normalizedCpf)]);

  if (excludeId) {
    request = request.neq("id", excludeId);
  }

  const { count, error } = await request;

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: (count ?? 0) > 0, error: null };
}

async function upsertEndereco(
  supabase: SupabaseClient,
  endereco: CadastroEndereco,
  enderecoId?: string
): Promise<ServiceResult<string | null>> {
  if (enderecoId) {
    const { error } = await supabase
      .from("cad_enderecos")
      .update(endereco)
      .eq("id", enderecoId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: enderecoId, error: null };
  }

  const { data, error } = await supabase
    .from("cad_enderecos")
    .insert(endereco)
    .select("id")
    .single();

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
    const { error } = await supabase
      .from("cad_rntrc")
      .update(rntrc)
      .eq("id", rntrcId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: rntrcId, error: null };
  }

  const { data, error } = await supabase
    .from("cad_rntrc")
    .insert(rntrc)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.id as string, error: null };
}

export async function searchPessoasFisicas(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<CadastroSearchItem[]>> {
  const term = query.trim();

  if (!term) {
    return { data: [], error: null };
  }

  let request = supabase
    .from("cad_pessoas_fisicas")
    .select("id, cpf, nome, telefone, status")
    .order("nome", { ascending: true });

  if (term !== "%") {
    request = request.or(`nome.ilike.%${term}%,cpf.ilike.%${term}%`).limit(30);
  }

  const { data, error } = await request;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: ((data ?? []) as PessoaFisicaRow[]).map(toSearchItem), error: null };
}

export async function getPessoaFisicaById(
  supabase: SupabaseClient,
  id: string
): Promise<ServiceResult<PessoaFisica | null>> {
  const { data: pessoaData, error: pessoaError } = await supabase
    .from("cad_pessoas_fisicas")
    .select("*")
    .eq("id", id)
    .single();

  if (pessoaError) {
    return { data: null, error: pessoaError.message };
  }

  const pessoa = pessoaData as PessoaFisicaRow;

  const [{ data: enderecoData }, { data: rntrcData }, { data: documentosData }] = await Promise.all([
    supabase.from("cad_enderecos").select("*").eq("id", pessoa.endereco_id).single(),
    pessoa.rntrc_id ? supabase.from("cad_rntrc").select("*").eq("id", pessoa.rntrc_id).single() : Promise.resolve({ data: null }),
    supabase.from("cad_pessoas_fisicas_documentos").select("*").eq("pessoa_fisica_id", id).single(),
  ]);

  const endereco = (enderecoData as CadastroEnderecoRow | null) ?? null;
  const rntrc = (rntrcData as CadastroRntrcRow | null) ?? null;
  const documentos = (documentosData as PessoaFisicaDocumentosRow | null) ?? null;

  const model: PessoaFisica = {
    id: pessoa.id,
    cpf: pessoa.cpf,
    nome: pessoa.nome,
    data_nascimento: pessoa.data_nascimento,
    telefone: pessoa.telefone,
    status: pessoa.status,
    nacionalidade: pessoa.nacionalidade,
    naturalidade: pessoa.naturalidade,
    grau_instrucao: pessoa.grau_instrucao,
    estado_civil: pessoa.estado_civil,
    raca_cor: pessoa.raca_cor,
    rg_numero: documentos?.rg_numero ?? null,
    rg_orgao_expedidor: documentos?.rg_orgao_expedidor ?? null,
    rg_uf: documentos?.rg_uf ?? null,
    rg_data_emissao: documentos?.rg_data_emissao ?? null,
    cnh_numero: documentos?.cnh_numero ?? null,
    cnh_registro: documentos?.cnh_registro ?? null,
    cnh_codigo_seguranca: documentos?.cnh_codigo_seguranca ?? null,
    cnh_renach: documentos?.cnh_renach ?? null,
    cnh_data_primeira_habilitacao: documentos?.cnh_data_primeira_habilitacao ?? null,
    cnh_data_emissao: documentos?.cnh_data_emissao ?? null,
    cnh_validade: documentos?.cnh_validade ?? null,
    cnh_uf: documentos?.cnh_uf ?? null,
    cnh_categoria: documentos?.cnh_categoria ?? null,
    cnh_orgao_emissor: documentos?.cnh_orgao_emissor ?? null,
    modalidade: pessoa.modalidade,
    situacao: pessoa.situacao,
    email: pessoa.email,
    filiacao_pai: pessoa.filiacao_pai,
    filiacao_mae: pessoa.filiacao_mae,
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
  };

  return { data: model, error: null };
}

export async function upsertPessoaFisica(
  supabase: SupabaseClient,
  input: { id?: string; data: PessoaFisicaPayload }
): Promise<ServiceResult<PessoaFisica | null>> {
  const normalizedCpf = normalizeDocument(input.data.cpf);

  if (!validators.cpf(normalizedCpf)) {
    return { data: null, error: "CPF inválido." };
  }

  const duplicateCpf = await isCpfAlreadyRegistered(supabase, normalizedCpf, input.id);
  if (duplicateCpf.error) {
    return { data: null, error: duplicateCpf.error };
  }
  if (duplicateCpf.data) {
    return { data: null, error: "Já existe um cadastro com este CPF/CNPJ" };
  }

  let enderecoId: string | undefined;
  let rntrcId: string | null | undefined;

  if (input.id) {
    const { data: current } = await supabase
      .from("cad_pessoas_fisicas")
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

  const pessoaPayload = {
    cpf: normalizedCpf,
    nome: input.data.nome,
    data_nascimento: input.data.data_nascimento,
    telefone: input.data.telefone,
    status: input.data.status,
    nacionalidade: input.data.nacionalidade,
    naturalidade: input.data.naturalidade,
    grau_instrucao: input.data.grau_instrucao,
    estado_civil: input.data.estado_civil,
    raca_cor: input.data.raca_cor,
    modalidade: input.data.modalidade,
    situacao: input.data.situacao,
    email: input.data.email,
    filiacao_pai: input.data.filiacao_pai,
    filiacao_mae: input.data.filiacao_mae,
    endereco_id: enderecoResult.data,
    rntrc_id: rntrcResult.data,
  };

  let pessoaId = input.id;

  if (input.id) {
    const { error } = await supabase
      .from("cad_pessoas_fisicas")
      .update(pessoaPayload)
      .eq("id", input.id);

    if (error) {
      return { data: null, error: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("cad_pessoas_fisicas")
      .insert(pessoaPayload)
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    pessoaId = data.id as string;
  }

  if (!pessoaId) {
    return { data: null, error: "Pessoa fisica nao localizada apos gravacao." };
  }

  const docPayload = {
    pessoa_fisica_id: pessoaId,
    rg_numero: input.data.rg_numero,
    rg_orgao_expedidor: input.data.rg_orgao_expedidor,
    rg_uf: input.data.rg_uf,
    rg_data_emissao: input.data.rg_data_emissao,
    cnh_numero: input.data.cnh_numero,
    cnh_registro: input.data.cnh_registro,
    cnh_codigo_seguranca: input.data.cnh_codigo_seguranca,
    cnh_renach: input.data.cnh_renach,
    cnh_data_primeira_habilitacao: input.data.cnh_data_primeira_habilitacao,
    cnh_data_emissao: input.data.cnh_data_emissao,
    cnh_validade: input.data.cnh_validade,
    cnh_uf: input.data.cnh_uf,
    cnh_categoria: input.data.cnh_categoria,
    cnh_orgao_emissor: input.data.cnh_orgao_emissor,
  };

  const { error: docError } = await supabase
    .from("cad_pessoas_fisicas_documentos")
    .upsert(docPayload, { onConflict: "pessoa_fisica_id" });

  if (docError) {
    return { data: null, error: docError.message };
  }

  return getPessoaFisicaById(supabase, pessoaId);
}
