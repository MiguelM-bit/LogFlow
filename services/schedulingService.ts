/**
 * Scheduling Service — pure business logic
 * No UI, no side effects, no Supabase calls.
 * All functions are deterministic and testable.
 */

import type { Composicao, ProgramacaoCargaComSLA, SLAPrioridade } from "@/types";

// ─────────────────────────────────────────────
// Priority Engine
// ─────────────────────────────────────────────

export type PriorityCategory = "critico" | "urgente" | "normal";

export interface PriorityScore {
  score: number;
  category: PriorityCategory;
  reasons: string[];
}

export function calculateLoadPriority(
  carga: ProgramacaoCargaComSLA,
  now = new Date()
): PriorityScore {
  let score = 0;
  const reasons: string[] = [];

  // No driver/composition assigned
  if (!carga.composicao_id) {
    score += 50;
    reasons.push("Sem motorista atribuído");
  }

  // Already late
  if (carga.status_operacional === "atrasado") {
    score += 100;
    reasons.push("Carga atrasada");
  }

  // SLA urgency
  if (carga.prioridade === "critico") {
    score += 80;
    reasons.push("SLA crítico (< 2h)");
  } else if (carga.prioridade === "alerta") {
    score += 40;
    reasons.push("SLA em alerta (< 4h)");
  }

  // Pickup window approaching fast
  if (carga.horario_coleta) {
    const diffMs = new Date(carga.horario_coleta).getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;
    if (diffMs > 0 && diffMs <= oneHour) {
      score += 30;
      reasons.push("Coleta em menos de 1h");
    }
  }

  const category: PriorityCategory =
    score >= 130 ? "critico" : score >= 50 ? "urgente" : "normal";

  return { score, category, reasons };
}

export function sortBySLA(
  cargas: ProgramacaoCargaComSLA[],
  now = new Date()
): ProgramacaoCargaComSLA[] {
  return [...cargas].sort((a, b) => {
    const sa = calculateLoadPriority(a, now).score;
    const sb = calculateLoadPriority(b, now).score;
    if (sb !== sa) return sb - sa;
    if (!a.horario_coleta) return 1;
    if (!b.horario_coleta) return -1;
    return new Date(a.horario_coleta).getTime() - new Date(b.horario_coleta).getTime();
  });
}

// ─────────────────────────────────────────────
// Driver / Composição Suggestion
// ─────────────────────────────────────────────

export function getOccupiedComposicoes(cargas: ProgramacaoCargaComSLA[]): Set<string> {
  return new Set(
    cargas
      .filter((c) => Boolean(c.composicao_id) && c.status_viagem !== "concluida")
      .map((c) => c.composicao_id as string)
  );
}

export function suggestBestComposicao(
  carga: ProgramacaoCargaComSLA,
  composicoes: Composicao[],
  occupied: Set<string>
): Composicao | null {
  const available = composicoes.filter(
    (c) => c.ativo && (!occupied.has(c.id) || c.id === carga.composicao_id)
  );
  if (available.length === 0) return null;
  // Prefer composicoes with a motorista name for clarity
  const withDriver = available.filter((c) => c.motorista?.nome);
  return withDriver[0] ?? available[0];
}

// ─────────────────────────────────────────────
// Composition Grouping (proximity-based)
// ─────────────────────────────────────────────

export interface CompositionGroup {
  key: string;
  loads: ProgramacaoCargaComSLA[];
  label: string;
}

export function generateCompositionGroups(
  cargas: ProgramacaoCargaComSLA[]
): CompositionGroup[] {
  const unassigned = cargas.filter((c) => !c.composicao_id && c.status_viagem !== "concluida");

  const groups = new Map<string, ProgramacaoCargaComSLA[]>();

  for (const carga of unassigned) {
    // Normalise origin: take city/first segment before comma or slash
    const key = carga.origem
      .split(/[,/–-]/)[0]
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(carga);
  }

  return [...groups.entries()]
    .filter(([, loads]) => loads.length >= 2)
    .map(([key, loads]) => ({
      key,
      loads,
      label: loads[0].origem.split(/[,/–-]/)[0].trim(),
    }))
    .sort((a, b) => b.loads.length - a.loads.length);
}

// ─────────────────────────────────────────────
// SLA countdown helpers
// ─────────────────────────────────────────────

export interface SLACountdown {
  label: string;
  isOverdue: boolean;
  minutesLeft: number | null;
}

export function getSLACountdown(
  horario_coleta: string | null,
  now = new Date()
): SLACountdown {
  if (!horario_coleta) {
    return { label: "Sem horário", isOverdue: false, minutesLeft: null };
  }
  const coleta = new Date(horario_coleta);
  const diffMs = coleta.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) {
    const overMin = Math.abs(diffMin);
    if (overMin >= 60) {
      const h = Math.floor(overMin / 60);
      const m = overMin % 60;
      return { label: `${h}h${m > 0 ? ` ${m}min` : ""} atrasado`, isOverdue: true, minutesLeft: diffMin };
    }
    return { label: `${overMin}min atrasado`, isOverdue: true, minutesLeft: diffMin };
  }

  if (diffMin === 0) return { label: "Agora", isOverdue: false, minutesLeft: 0 };
  if (diffMin < 60) return { label: `${diffMin}min restantes`, isOverdue: false, minutesLeft: diffMin };
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return {
    label: `${h}h${m > 0 ? ` ${m}min` : ""} restantes`,
    isOverdue: false,
    minutesLeft: diffMin,
  };
}

// ─────────────────────────────────────────────
// Action Suggestions
// ─────────────────────────────────────────────

export type ActionType = "assign_driver" | "group_loads" | "urgent_alert";

export interface ActionSuggestion {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  cargaIds: string[];
  composicaoId?: string;
}

export function generateActionSuggestions(
  cargas: ProgramacaoCargaComSLA[],
  composicoes: Composicao[]
): ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = [];
  const occupied = getOccupiedComposicoes(cargas);

  // Suggest driver assignment for critical loads without one
  const criticalWithoutDriver = cargas.filter(
    (c) => !c.composicao_id && c.prioridade === "critico" && c.status_viagem !== "concluida"
  );
  for (const carga of criticalWithoutDriver.slice(0, 3)) {
    const best = suggestBestComposicao(carga, composicoes, occupied);
    if (best) {
      suggestions.push({
        id: `assign-${carga.id}`,
        type: "assign_driver",
        title: `Atribuir motorista a "${carga.cliente}"`,
        description: `Sugestão: ${best.motorista?.nome ?? "Motorista"} (${best.cavalo?.placa ?? "Cavalo"}) → ${carga.origem} → ${carga.destino}`,
        cargaIds: [carga.id],
        composicaoId: best.id,
      });
    }
  }

  // Suggest grouping for loads with same origin
  const groups = generateCompositionGroups(cargas);
  for (const group of groups.slice(0, 2)) {
    suggestions.push({
      id: `group-${group.key}`,
      type: "group_loads",
      title: `${group.loads.length} cargas podem ser agrupadas`,
      description: `Origem comum: ${group.label} — economize viagens combinando essas cargas.`,
      cargaIds: group.loads.map((l) => l.id),
    });
  }

  return suggestions;
}
