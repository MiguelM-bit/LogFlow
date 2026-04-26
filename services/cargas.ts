import { Composicao, JanelaHorarioFiltro, ProgramacaoCarga, ProgramacaoCargaComSLA, ProgramacaoFiltrosComSLA, ProgramacaoStatus, SLAPrioridade, SumarioExecutivo } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listComposicoes } from "./composicoes";
import { ServiceResult } from "./types";

interface CargaProgramacaoRow {
  id: string;
  origem: string;
  destino: string;
  horario_coleta: string | null;
  empresa_vinc: string | null;
  status: "disponivel" | "negociando" | "programada" | "concluida" | null;
  composicao_id: string | null;
}

function getProgramacaoStatus(
  row: CargaProgramacaoRow,
  hasComposicao: boolean,
  now = new Date()
): ProgramacaoStatus {
  const coleta = row.horario_coleta ? new Date(row.horario_coleta) : null;

  if (coleta && coleta.getTime() < now.getTime() && !hasComposicao) {
    return "atrasado";
  }

  if (hasComposicao) {
    return "programada";
  }

  return "pendente";
}

function getSLAPrioridade(
  row: CargaProgramacaoRow,
  hasComposicao: boolean,
  now = new Date()
): SLAPrioridade {
  const coleta = row.horario_coleta ? new Date(row.horario_coleta) : null;

  // Já atrasada sem composição
  if (!hasComposicao && coleta && coleta.getTime() < now.getTime()) {
    return "critico";
  }

  // Coleta em até 2h sem composição
  if (!hasComposicao && coleta) {
    const diff = coleta.getTime() - now.getTime();
    const duas_horas = 2 * 60 * 60 * 1000;
    const quatro_horas = 4 * 60 * 60 * 1000;

    if (diff <= duas_horas) {
      return "critico";
    }

    if (diff <= quatro_horas) {
      return "alerta";
    }
  }

  return "ok";
}

function compositionLabel(composicao: Composicao | undefined) {
  if (!composicao) {
    return "Sem composicao";
  }

  const motorista = composicao.motorista?.nome ?? "Motorista";
  const cavalo = composicao.cavalo?.placa ?? "Cavalo";
  const carreta = composicao.carreta?.placa ?? "Carreta";

  return `${motorista} | ${cavalo} + ${carreta}`;
}

export async function listProgramacaoCargas(
  supabase: SupabaseClient
): Promise<ServiceResult<ProgramacaoCarga[]>> {
  const { data, error } = await supabase
    .from("cargas")
    .select("id, origem, destino, horario_coleta, empresa_vinc, status, composicao_id")
    .order("horario_coleta", { ascending: true, nullsFirst: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const composicoesResult = await listComposicoes(supabase);
  const composicoes = composicoesResult.data;
  const composicoesMap = new Map(composicoes.map((item) => [item.id, item]));

  const rows = (data ?? []) as CargaProgramacaoRow[];
  const now = new Date();

  const mapped = rows.map((row) => {
    const composicao = row.composicao_id ? composicoesMap.get(row.composicao_id) : undefined;
    const statusOperacional = getProgramacaoStatus(row, Boolean(composicao), now);

    return {
      id: row.id,
      cliente: row.empresa_vinc ?? "Nao informado",
      origem: row.origem,
      destino: row.destino,
      horario_coleta: row.horario_coleta,
      empresa_vinc: row.empresa_vinc,
      status_viagem: row.status,
      status_operacional: statusOperacional,
      composicao_id: row.composicao_id,
      motorista_composicao: compositionLabel(composicao),
      urgente: statusOperacional === "atrasado",
    };
  });

  return {
    data: mapped,
    error: composicoesResult.error,
  };
}

export async function listProgramacaoCargasComSLA(
  supabase: SupabaseClient
): Promise<ServiceResult<ProgramacaoCargaComSLA[]>> {
  const base = await listProgramacaoCargas(supabase);
  const now = new Date();

  const withSLA: ProgramacaoCargaComSLA[] = base.data.map((carga) => {
    const hasComposicao = Boolean(carga.composicao_id);
    const row: CargaProgramacaoRow = {
      id: carga.id,
      origem: carga.origem,
      destino: carga.destino,
      horario_coleta: carga.horario_coleta,
      empresa_vinc: carga.empresa_vinc,
      status: carga.status_viagem,
      composicao_id: carga.composicao_id,
    };
    const prioridade = getSLAPrioridade(row, hasComposicao, now);
    return { ...carga, prioridade };
  });

  // Sort: CRÍTICO > ALERTA > OK, then by horario_coleta ASC
  const ordemPrioridade: Record<SLAPrioridade, number> = { critico: 0, alerta: 1, ok: 2 };
  withSLA.sort((a, b) => {
    const diff = ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
    if (diff !== 0) return diff;
    if (!a.horario_coleta) return 1;
    if (!b.horario_coleta) return -1;
    return new Date(a.horario_coleta).getTime() - new Date(b.horario_coleta).getTime();
  });

  return {
    data: withSLA,
    error: base.error,
  };
}

export async function getSumarioExecutivo(
  supabase: SupabaseClient
): Promise<ServiceResult<SumarioExecutivo>> {
  const result = await listProgramacaoCargasComSLA(supabase);
  const cargas = result.data.filter((c) => c.status_viagem !== "concluida");

  return {
    data: {
      totalCritico: cargas.filter((c) => c.prioridade === "critico").length,
      aguardandoMotorista: cargas.filter((c) => !c.composicao_id).length,
      emTransito: cargas.filter((c) => c.status_viagem === "programada" && c.composicao_id).length,
      totalCargas: cargas.length,
    },
    error: result.error,
  };
}

export async function assignComposicaoToCarga(
  supabase: SupabaseClient,
  input: { cargaId: string; composicaoId: string }
): Promise<ServiceResult<boolean>> {
  const { data: conflito, error: conflitoError } = await supabase
    .from("cargas")
    .select("id")
    .eq("composicao_id", input.composicaoId)
    .neq("id", input.cargaId)
    .or("status.is.null,status.neq.concluida")
    .limit(1);

  if (conflitoError) {
    return { data: false, error: conflitoError.message };
  }

  if ((conflito ?? []).length > 0) {
    return {
      data: false,
      error: "Esta composicao ja esta vinculada a outra viagem em andamento.",
    };
  }

  const { error } = await supabase
    .from("cargas")
    .update({ composicao_id: input.composicaoId, status: "programada", updated_at: new Date().toISOString() })
    .eq("id", input.cargaId);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export async function removeComposicaoFromCarga(
  supabase: SupabaseClient,
  input: { cargaId: string }
): Promise<ServiceResult<boolean>> {
  const { data: carga, error: cargaError } = await supabase
    .from("cargas")
    .select("id, horario_coleta, status")
    .eq("id", input.cargaId)
    .single();

  if (cargaError) {
    return { data: false, error: cargaError.message };
  }

  const now = new Date();
  const coleta = carga.horario_coleta ? new Date(carga.horario_coleta) : null;
  const passouDaColeta = coleta ? coleta.getTime() < now.getTime() : false;

  if (passouDaColeta && carga.status !== "concluida") {
    return {
      data: false,
      error: "Nao e possivel remover composicao de viagem passada sem concluir a viagem.",
    };
  }

  const { error } = await supabase
    .from("cargas")
    .update({ composicao_id: null, updated_at: new Date().toISOString() })
    .eq("id", input.cargaId);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export function applyProgramacaoFilters(
  cargas: ProgramacaoCarga[],
  filters: { semMotorista: boolean; janelaHorario: JanelaHorarioFiltro; busca: string },
  now?: Date
): ProgramacaoCarga[];
export function applyProgramacaoFilters(
  cargas: ProgramacaoCargaComSLA[],
  filters: ProgramacaoFiltrosComSLA,
  now?: Date
): ProgramacaoCargaComSLA[];
export function applyProgramacaoFilters(
  cargas: (ProgramacaoCarga | ProgramacaoCargaComSLA)[],
  filters: { semMotorista: boolean; janelaHorario: JanelaHorarioFiltro; busca: string; prioridade?: string; somenteCriticos?: boolean; cliente?: string },
  now = new Date()
) {
  const busca = filters.busca.trim().toLowerCase();

  return (cargas as ProgramacaoCargaComSLA[]).filter((carga) => {
    if (filters.somenteCriticos && carga.prioridade !== "critico") {
      return false;
    }

    if (filters.prioridade && filters.prioridade !== "todos" && carga.prioridade !== filters.prioridade) {
      return false;
    }

    if (filters.cliente && filters.cliente !== "todos" && carga.cliente !== filters.cliente) {
      return false;
    }

    if (filters.semMotorista && carga.composicao_id) {
      return false;
    }

    if (filters.janelaHorario !== "todos") {
      const coleta = carga.horario_coleta ? new Date(carga.horario_coleta) : null;

      if (!coleta) {
        return false;
      }

      const diff = coleta.getTime() - now.getTime();
      const next2h = 2 * 60 * 60 * 1000;
      const next4h = 4 * 60 * 60 * 1000;
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      if (filters.janelaHorario === "2h" && (diff < 0 || diff > next2h)) {
        return false;
      }

      if (filters.janelaHorario === "4h" && (diff < 0 || diff > next4h)) {
        return false;
      }

      if (filters.janelaHorario === "hoje" && coleta.getTime() > endOfDay.getTime()) {
        return false;
      }
    }

    if (busca) {
      const target = `${carga.cliente} ${carga.origem} ${carga.destino} ${carga.empresa_vinc ?? ""}`.toLowerCase();
      if (!target.includes(busca)) {
        return false;
      }
    }

    return true;
  });
}
