"use client";

import { X, ArrowRight, Clock, Truck, User, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useState } from "react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import {
  calculateLoadPriority,
  getSLACountdown,
  suggestBestComposicao,
} from "@/services/schedulingService";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface LoadDetailsDrawerProps {
  carga: ProgramacaoCargaComSLA | null;
  composicoes: Composicao[];
  occupiedComposicoes: Set<string>;
  loadingId: string | null;
  onClose: () => void;
  onAssign: (cargaId: string, composicaoId: string) => void;
  onRemove: (cargaId: string) => void;
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const statusLabels: Record<string, string> = {
  disponivel: "Disponível",
  negociando: "Negociando",
  programada: "Programada",
  concluida: "Concluída",
};

export function LoadDetailsDrawer({
  carga,
  composicoes,
  occupiedComposicoes,
  loadingId,
  onClose,
  onAssign,
  onRemove,
}: LoadDetailsDrawerProps) {
  const [selectedComposicao, setSelectedComposicao] = useState("");

  if (!carga) return null;

  const sla = getSLACountdown(carga.horario_coleta);
  const priority = calculateLoadPriority(carga);
  const suggestion = carga.composicao_id
    ? null
    : suggestBestComposicao(carga, composicoes, occupiedComposicoes);
  const currentComposicao = carga.composicao_id
    ? composicoes.find((c) => c.id === carga.composicao_id)
    : null;
  const isLoading = loadingId === carga.id;

  const availableComposicoes = composicoes.filter(
    (c) => c.ativo && (!occupiedComposicoes.has(c.id) || c.id === carga.composicao_id)
  );

  const handleAssign = () => {
    const id = selectedComposicao || suggestion?.id;
    if (id) onAssign(carga.id, id);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[1110] flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Detalhes da Carga</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Priority banner */}
          {priority.category !== "normal" && (
            <div
              className={`flex items-start gap-3 rounded-xl p-3 ${
                priority.category === "critico"
                  ? "bg-rose-50 border border-rose-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                  priority.category === "critico" ? "text-rose-500" : "text-amber-500"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-semibold ${
                    priority.category === "critico" ? "text-rose-700" : "text-amber-700"
                  }`}
                >
                  {priority.category === "critico" ? "Ação Imediata Necessária" : "Atenção Requerida"}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {priority.reasons.map((r) => (
                    <li
                      key={r}
                      className={`text-xs ${
                        priority.category === "critico" ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Client & route */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Carga
            </h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="text-sm font-semibold text-slate-900">{carga.cliente}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Origem</p>
                  <p className="text-sm text-slate-800">{carga.origem}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                <div className="flex-1 text-right">
                  <p className="text-xs text-slate-500">Destino</p>
                  <p className="text-sm text-slate-800">{carga.destino}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SLA & timing */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Horário e SLA
            </h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Coleta</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatDate(carga.horario_coleta)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">SLA Restante</span>
                <span
                  className={`text-sm font-semibold ${
                    sla.isOverdue ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {sla.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Status</span>
                <Badge
                  variant={
                    carga.status_operacional === "atrasado"
                      ? "danger"
                      : carga.status_operacional === "programada"
                      ? "success"
                      : "warning"
                  }
                >
                  {statusLabels[carga.status_viagem ?? ""] ?? carga.status_operacional}
                </Badge>
              </div>
            </div>
          </section>

          {/* Current assignment */}
          {currentComposicao && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Composição Atual
              </h3>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">Atribuída</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {currentComposicao.motorista?.nome ?? "Motorista"}
                  </span>
                  {currentComposicao.motorista?.telefone && (
                    <span className="text-xs text-slate-500">
                      ({currentComposicao.motorista.telefone})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {currentComposicao.cavalo?.placa ?? "Cavalo"} +{" "}
                    {currentComposicao.carreta?.placa ?? "Carreta"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={isLoading}
                  onClick={() => onRemove(carga.id)}
                >
                  {isLoading ? "Removendo..." : "Remover composição"}
                </Button>
              </div>
            </section>
          )}

          {/* Driver assignment */}
          {!currentComposicao && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Atribuir Motorista
              </h3>

              {suggestion && (
                <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Sugestão Inteligente</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        {suggestion.motorista?.nome ?? "Motorista"}
                      </p>
                      <p className="text-xs text-blue-600">
                        {suggestion.cavalo?.placa ?? "Cavalo"} +{" "}
                        {suggestion.carreta?.placa ?? "Carreta"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={isLoading}
                      onClick={() => onAssign(carga.id, suggestion.id)}
                    >
                      {isLoading ? "..." : "Aplicar"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Select value={selectedComposicao} onValueChange={setSelectedComposicao}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Escolher composição manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComposicoes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.motorista?.nome ?? "Motorista"} • {item.cavalo?.placa ?? "Cavalo"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!selectedComposicao || isLoading}
                  onClick={handleAssign}
                >
                  {isLoading ? "Atribuindo..." : "Confirmar Atribuição"}
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
