"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import {
  assignComposicaoToCarga,
  listProgramacaoCargasComSLA,
  removeComposicaoFromCarga,
} from "@/services/cargas";
import { listComposicoesAtivas } from "@/services/composicoes";
import {
  generateActionSuggestions,
  getOccupiedComposicoes,
  sortBySLA,
  type ActionSuggestion,
} from "@/services/schedulingService";
import { supabase } from "@/lib/supabase";

export interface UseSchedulingResult {
  cargas: ProgramacaoCargaComSLA[];
  composicoes: Composicao[];
  criticalCargas: ProgramacaoCargaComSLA[];
  suggestions: ActionSuggestion[];
  occupiedComposicoes: Set<string>;
  loadingId: string | null;
  error: string | null;
  feedback: string | null;
  refresh: () => Promise<void>;
  assign: (cargaId: string, composicaoId: string) => Promise<boolean>;
  remove: (cargaId: string) => Promise<boolean>;
}

export function useScheduling(
  initialCargas: ProgramacaoCargaComSLA[],
  initialComposicoes: Composicao[]
): UseSchedulingResult {
  const [cargas, setCargas] = useState<ProgramacaoCargaComSLA[]>(() =>
    sortBySLA(initialCargas)
  );
  const [composicoes, setComposicoes] = useState<Composicao[]>(initialComposicoes);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    try {
      const [cargasResult, composicoesResult] = await Promise.all([
        listProgramacaoCargasComSLA(supabase),
        listComposicoesAtivas(supabase),
      ]);
      setCargas(sortBySLA(cargasResult.data));
      setComposicoes(composicoesResult.data);
      setError(cargasResult.error ?? composicoesResult.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      inflightRef.current = false;
    }
  }, []);

  const assign = useCallback(
    async (cargaId: string, composicaoId: string): Promise<boolean> => {
      setLoadingId(cargaId);
      const result = await assignComposicaoToCarga(supabase, { cargaId, composicaoId });
      setLoadingId(null);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await refresh();
      setFeedback("Composição atribuída com sucesso.");
      setTimeout(() => setFeedback(null), 3000);
      return true;
    },
    [refresh]
  );

  const remove = useCallback(
    async (cargaId: string): Promise<boolean> => {
      setLoadingId(cargaId);
      const result = await removeComposicaoFromCarga(supabase, { cargaId });
      setLoadingId(null);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await refresh();
      setFeedback("Composição removida.");
      setTimeout(() => setFeedback(null), 3000);
      return true;
    },
    [refresh]
  );

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase
        .channel("scheduling-cargas")
        .on("postgres_changes", { event: "*", schema: "public", table: "cargas" }, () =>
          void refresh()
        )
        .subscribe(),
      supabase
        .channel("scheduling-composicoes")
        .on("postgres_changes", { event: "*", schema: "public", table: "composicoes" }, () =>
          void refresh()
        )
        .subscribe(),
    ];
    return () => {
      channels.forEach((c) => void supabase.removeChannel(c));
    };
  }, [refresh]);

  const criticalCargas = useMemo(
    () =>
      cargas.filter(
        (c) => c.prioridade === "critico" && c.status_viagem !== "concluida"
      ),
    [cargas]
  );

  const occupiedComposicoes = useMemo(() => getOccupiedComposicoes(cargas), [cargas]);

  const suggestions = useMemo(
    () => generateActionSuggestions(cargas, composicoes),
    [cargas, composicoes]
  );

  return {
    cargas,
    composicoes,
    criticalCargas,
    suggestions,
    occupiedComposicoes,
    loadingId,
    error,
    feedback,
    refresh,
    assign,
    remove,
  };
}
