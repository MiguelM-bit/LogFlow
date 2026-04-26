"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiltrosProgramacao } from "@/components/FiltrosProgramacao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Composicao,
  ProgramacaoCargaComSLA,
  ProgramacaoFiltrosComSLA,
  SLAPrioridade,
} from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  applyProgramacaoFilters,
  assignComposicaoToCarga,
  listProgramacaoCargasComSLA,
  removeComposicaoFromCarga,
} from "@/services/cargas";
import { listComposicoesAtivas } from "@/services/composicoes";
import { supabase } from "@/lib/supabase";

interface TableProgramacaoProps {
  initialCargas: ProgramacaoCargaComSLA[];
  initialComposicoes: Composicao[];
}

const INITIAL_FILTERS: ProgramacaoFiltrosComSLA = {
  semMotorista: false,
  janelaHorario: "todos",
  busca: "",
  prioridade: "todos",
  somenteCriticos: false,
  cliente: "todos",
};

function formatPickup(value: string | null) {
  if (!value) return "Sem horario";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function slaBadge(prioridade: SLAPrioridade) {
  if (prioridade === "critico") return { label: "Critico", variant: "danger" as const };
  if (prioridade === "alerta") return { label: "Alerta", variant: "warning" as const };
  return { label: "OK", variant: "success" as const };
}

function statusBadge(status: ProgramacaoCargaComSLA["status_operacional"]) {
  if (status === "programada") return { label: "Programada", variant: "success" as const };
  if (status === "atrasado") return { label: "Atrasado", variant: "danger" as const };
  return { label: "Pendente", variant: "warning" as const };
}

function rowClass(prioridade: SLAPrioridade): string {
  if (prioridade === "critico") return "bg-rose-50/40 hover:bg-rose-50/60";
  if (prioridade === "alerta") return "bg-amber-50/30 hover:bg-amber-50/50";
  return "";
}

// ETA mock: assume 60km/h, distância aleatória por hash do id (simulação)
function calcETA(composicao: Composicao | undefined, horario_coleta: string | null) {
  if (!composicao || !horario_coleta) return null;
  const seed = composicao.id.charCodeAt(0) + composicao.id.charCodeAt(1);
  const distKm = 20 + (seed % 80); // 20–100km mock
  const etaMinutes = Math.round((distKm / 60) * 60);
  const etaMs = etaMinutes * 60 * 1000;
  const chegada = new Date(Date.now() + etaMs);
  const coleta = new Date(horario_coleta);
  const viavel = chegada <= coleta;
  return { distKm, etaMinutes, viavel };
}

export function TableProgramacao({
  initialCargas,
  initialComposicoes,
}: TableProgramacaoProps) {
  const [cargas, setCargas] = useState(initialCargas);
  const [composicoes, setComposicoes] = useState(initialComposicoes);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);
  const [selectedComposicao, setSelectedComposicao] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshInFlightRef = useRef(false);

  const normalizeError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("fetch failed")) {
      return "Falha de conexão com o Supabase durante atualização em tempo real.";
    }
    return message;
  };

  const refreshAll = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    try {
      const [cargasResult, composicoesResult] = await Promise.all([
        listProgramacaoCargasComSLA(supabase),
        listComposicoesAtivas(supabase),
      ]);
      setCargas(cargasResult.data);
      setComposicoes(composicoesResult.data);
      setError(cargasResult.error ?? composicoesResult.error);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      refreshInFlightRef.current = false;
    }
  }, []);

  const handleAssign = async (cargaId: string) => {
    const composicaoId = selectedComposicao[cargaId];
    if (!composicaoId) return;
    setLoadingId(cargaId);
    const result = await assignComposicaoToCarga(supabase, { cargaId, composicaoId });
    setLoadingId(null);
    if (result.error) { setError(result.error); return; }
    await refreshAll();
    setFeedback("Composicao atribuida com sucesso.");
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleRemove = async (cargaId: string) => {
    setLoadingId(cargaId);
    const result = await removeComposicaoFromCarga(supabase, { cargaId });
    setLoadingId(null);
    if (result.error) { setError(result.error); return; }
    await refreshAll();
    setFeedback("Composicao removida da viagem.");
    setTimeout(() => setFeedback(null), 2500);
  };

  const clientes = useMemo(
    () => [...new Set(cargas.map((c) => c.cliente).filter(Boolean))].sort(),
    [cargas]
  );

  const filtered = useMemo(
    () => applyProgramacaoFilters(cargas, filtros) as ProgramacaoCargaComSLA[],
    [cargas, filtros]
  );

  const composicoesMap = useMemo(
    () => new Map(composicoes.map((c) => [c.id, c])),
    [composicoes]
  );

  const composicoesOcupadas = useMemo(
    () =>
      new Set(
        cargas
          .filter((c) => Boolean(c.composicao_id) && c.status_viagem !== "concluida")
          .map((c) => c.composicao_id as string)
      ),
    [cargas]
  );

  const criticoCount = filtered.filter((c) => c.prioridade === "critico").length;

  useEffect(() => {
    const cargasChannel = supabase
      .channel("programacao-cargas")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargas" }, () => {
        void refreshAll();
      })
      .subscribe();

    const composicoesChannel = supabase
      .channel("programacao-composicoes")
      .on("postgres_changes", { event: "*", schema: "public", table: "composicoes" }, () => {
        void refreshAll();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(cargasChannel);
      void supabase.removeChannel(composicoesChannel);
    };
  }, [refreshAll]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Painel de programacao</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} cargas visíveis
            {criticoCount > 0 && (
              <span className="ml-2 font-semibold text-rose-600">• {criticoCount} criticas</span>
            )}
          </p>
        </div>
      </div>

      <FiltrosProgramacao filtros={filtros} onChange={setFiltros} clientes={clientes} />

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">SLA</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Coleta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Composição</TableHead>
              <TableHead className="w-[300px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((carga) => {
              const sla = slaBadge(carga.prioridade);
              const badge = statusBadge(carga.status_operacional);
              const selectedId = selectedComposicao[carga.id];
              const selectedComp = selectedId ? composicoesMap.get(selectedId) : undefined;
              const eta = calcETA(selectedComp, carga.horario_coleta);

              return (
                <TableRow key={carga.id} className={rowClass(carga.prioridade)}>
                  <TableCell>
                    <Badge variant={sla.variant}>{sla.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{carga.cliente}</TableCell>
                  <TableCell>{carga.origem}</TableCell>
                  <TableCell>{carga.destino}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatPickup(carga.horario_coleta)}</TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm" title={carga.motorista_composicao}>
                    {carga.motorista_composicao}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={selectedComposicao[carga.id] ?? ""}
                          onValueChange={(value) =>
                            setSelectedComposicao((prev) => ({ ...prev, [carga.id]: value }))
                          }
                        >
                          <SelectTrigger className="h-9 w-[180px]">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {composicoes
                              .filter(
                                (item) =>
                                  !composicoesOcupadas.has(item.id) || item.id === carga.composicao_id
                              )
                              .map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.motorista?.nome ?? "Motorista"} • {item.cavalo?.placa ?? "Cavalo"}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => void handleAssign(carga.id)}
                          disabled={!selectedComposicao[carga.id] || loadingId === carga.id}
                        >
                          {loadingId === carga.id ? "..." : "Atribuir"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRemove(carga.id)}
                          disabled={!carga.composicao_id || loadingId === carga.id}
                        >
                          Remover
                        </Button>
                      </div>
                      {eta && (
                        <span
                          className={`text-xs font-medium ${
                            eta.viavel ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {eta.viavel ? "✓ Viável" : "✗ Risco de atraso"} — ~{eta.distKm}km /{" "}
                          {eta.etaMinutes}min
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-slate-500">
                  Nenhuma carga encontrada para os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
