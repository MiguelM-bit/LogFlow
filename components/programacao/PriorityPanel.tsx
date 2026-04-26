"use client";

import { AlertTriangle, ArrowRight, Zap } from "lucide-react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import { getSLACountdown, suggestBestComposicao } from "@/services/schedulingService";
import { Button } from "@/components/ui/button";

interface PriorityPanelProps {
  criticalCargas: ProgramacaoCargaComSLA[];
  composicoes: Composicao[];
  occupiedComposicoes: Set<string>;
  loadingId: string | null;
  onAssign: (cargaId: string, composicaoId: string) => void;
  onSelectLoad: (carga: ProgramacaoCargaComSLA) => void;
}

export function PriorityPanel({
  criticalCargas,
  composicoes,
  occupiedComposicoes,
  loadingId,
  onAssign,
  onSelectLoad,
}: PriorityPanelProps) {
  if (criticalCargas.length === 0) return null;

  const top = criticalCargas.slice(0, 5);

  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/60 p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-base font-bold text-rose-800">
            {criticalCargas.length === 1
              ? "1 carga crítica precisa de ação imediata"
              : `${criticalCargas.length} cargas críticas precisam de ação imediata`}
          </p>
          <p className="text-sm text-rose-600">Resolva agora para evitar atrasos operacionais</p>
        </div>
      </div>

      {/* Critical load list */}
      <div className="space-y-2">
        {top.map((carga) => {
          const sla = getSLACountdown(carga.horario_coleta);
          const suggestion = suggestBestComposicao(carga, composicoes, occupiedComposicoes);
          const isLoading = loadingId === carga.id;

          return (
            <div
              key={carga.id}
              className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-white/80 p-3 shadow-sm transition-all duration-150 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Load info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                    <Zap className="h-3 w-3" />
                    {sla.isOverdue ? "Atrasado" : "Crítico"}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {carga.cliente}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="truncate">{carga.origem}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{carga.destino}</span>
                </div>
                <p
                  className={`mt-0.5 text-xs font-medium ${
                    sla.isOverdue ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {sla.label}
                </p>
                {!carga.composicao_id && suggestion && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Sugestão:{" "}
                    <span className="font-medium text-slate-700">
                      {suggestion.motorista?.nome ?? "Motorista"} •{" "}
                      {suggestion.cavalo?.placa ?? "Cavalo"}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 gap-2">
                {!carga.composicao_id && suggestion && (
                  <Button
                    size="sm"
                    className="bg-rose-600 text-white hover:bg-rose-700"
                    disabled={isLoading}
                    onClick={() => onAssign(carga.id, suggestion.id)}
                  >
                    {isLoading ? "..." : "Atribuir"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => onSelectLoad(carga)}
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {criticalCargas.length > 5 && (
        <p className="mt-3 text-center text-xs text-rose-600">
          + {criticalCargas.length - 5} cargas críticas adicionais na lista abaixo
        </p>
      )}
    </div>
  );
}
