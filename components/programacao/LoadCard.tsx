"use client";

import { ArrowRight, Clock, Truck, User, ChevronRight } from "lucide-react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import {
  calculateLoadPriority,
  getSLACountdown,
  suggestBestComposicao,
} from "@/services/schedulingService";
import { Button } from "@/components/ui/button";

interface LoadCardProps {
  carga: ProgramacaoCargaComSLA;
  composicoes: Composicao[];
  occupiedComposicoes: Set<string>;
  loadingId: string | null;
  isHighlighted?: boolean;
  onAssign: (cargaId: string, composicaoId: string) => void;
  onSelect: (carga: ProgramacaoCargaComSLA) => void;
  onHover: (cargaId: string | null) => void;
}

const priorityConfig = {
  critico: {
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-700",
    label: "Crítico",
  },
  alerta: {
    border: "border-l-amber-400",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Alerta",
  },
  ok: {
    border: "border-l-emerald-400",
    dot: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    label: "OK",
  },
};

export function LoadCard({
  carga,
  composicoes,
  occupiedComposicoes,
  loadingId,
  isHighlighted,
  onAssign,
  onSelect,
  onHover,
}: LoadCardProps) {
  const sla = getSLACountdown(carga.horario_coleta);
  const priority = calculateLoadPriority(carga);
  const config = priorityConfig[carga.prioridade];
  const suggestion = carga.composicao_id
    ? null
    : suggestBestComposicao(carga, composicoes, occupiedComposicoes);
  const isLoading = loadingId === carga.id;

  const currentComposicao = carga.composicao_id
    ? composicoes.find((c) => c.id === carga.composicao_id)
    : null;

  return (
    <div
      className={`group relative flex gap-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-150
        ${isHighlighted ? "scale-[1.01] shadow-md ring-2 ring-blue-300" : "hover:scale-[1.01] hover:shadow-md"}
        border-l-4 ${config.border}`}
      onMouseEnter={() => onHover(carga.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Priority dot */}
      <div className="flex flex-col items-center justify-between gap-2 px-3 py-4">
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${config.dot} flex-shrink-0`} />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${config.badge}`}
              >
                {config.label}
              </span>
              <span className="truncate text-sm font-semibold text-slate-900">
                {carga.cliente}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="truncate max-w-[120px]">{carga.origem}</span>
              <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-300" />
              <span className="truncate max-w-[120px]">{carga.destino}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(carga)}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* SLA countdown */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <span
            className={`text-xs font-medium ${
              sla.isOverdue
                ? "text-rose-600"
                : priority.category === "critico"
                ? "text-amber-600"
                : "text-slate-600"
            }`}
          >
            {sla.label}
          </span>
        </div>

        {/* Driver / Suggestion row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {currentComposicao ? (
              <>
                <Truck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                <span className="truncate text-xs text-emerald-700 font-medium">
                  {currentComposicao.motorista?.nome ?? "Motorista"} •{" "}
                  {currentComposicao.cavalo?.placa ?? "Cavalo"}
                </span>
              </>
            ) : suggestion ? (
              <>
                <User className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                <span className="truncate text-xs text-blue-600">
                  Sugestão: {suggestion.motorista?.nome ?? "Motorista"} •{" "}
                  {suggestion.cavalo?.placa ?? "Cavalo"}
                </span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                <span className="text-xs text-slate-400">Sem motorista disponível</span>
              </>
            )}
          </div>

          {/* Quick assign */}
          {!currentComposicao && suggestion && (
            <Button
              size="sm"
              className="h-7 flex-shrink-0 px-2.5 text-xs"
              disabled={isLoading}
              onClick={() => onAssign(carga.id, suggestion.id)}
            >
              {isLoading ? "..." : "Atribuir"}
            </Button>
          )}
        </div>

        {/* Priority reasons (collapse on ok) */}
        {priority.category !== "normal" && priority.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {priority.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
