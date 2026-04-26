"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import { LoadCard } from "./LoadCard";
import { Input } from "@/components/ui/input";

interface LoadListProps {
  cargas: ProgramacaoCargaComSLA[];
  composicoes: Composicao[];
  occupiedComposicoes: Set<string>;
  loadingId: string | null;
  highlightedId: string | null;
  onAssign: (cargaId: string, composicaoId: string) => void;
  onSelect: (carga: ProgramacaoCargaComSLA) => void;
  onHover: (cargaId: string | null) => void;
}

export function LoadList({
  cargas,
  composicoes,
  occupiedComposicoes,
  loadingId,
  highlightedId,
  onAssign,
  onSelect,
  onHover,
}: LoadListProps) {
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"todos" | "critico" | "alerta" | "ok">(
    "todos"
  );

  const filtered = useMemo(() => {
    let result = cargas.filter((c) => c.status_viagem !== "concluida");

    if (filterPriority !== "todos") {
      result = result.filter((c) => c.prioridade === filterPriority);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.cliente?.toLowerCase().includes(q) ||
          c.origem.toLowerCase().includes(q) ||
          c.destino.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cargas, filterPriority, search]);

  const counts = useMemo(() => {
    const active = cargas.filter((c) => c.status_viagem !== "concluida");
    return {
      critico: active.filter((c) => c.prioridade === "critico").length,
      alerta: active.filter((c) => c.prioridade === "alerta").length,
      ok: active.filter((c) => c.prioridade === "ok").length,
    };
  }, [cargas]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search & filter bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 bg-white"
            placeholder="Buscar por cliente, origem, destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Priority filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          {(["todos", "critico", "alerta", "ok"] as const).map((p) => {
            const isActive = filterPriority === p;
            const colorMap = {
              todos: isActive ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50",
              critico: isActive ? "bg-rose-600 text-white border-rose-600" : "border-rose-200 text-rose-600 hover:bg-rose-50",
              alerta: isActive ? "bg-amber-500 text-white border-amber-500" : "border-amber-200 text-amber-600 hover:bg-amber-50",
              ok: isActive ? "bg-emerald-600 text-white border-emerald-600" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
            };
            const labelMap = {
              todos: `Todos`,
              critico: `Crítico${counts.critico > 0 ? ` (${counts.critico})` : ""}`,
              alerta: `Alerta${counts.alerta > 0 ? ` (${counts.alerta})` : ""}`,
              ok: `OK${counts.ok > 0 ? ` (${counts.ok})` : ""}`,
            };

            return (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPriority(p)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${colorMap[p]}`}
              >
                {labelMap[p]}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? "carga" : "cargas"}
          </span>
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Nenhuma carga encontrada</p>
            <p className="mt-1 text-xs text-slate-400">Ajuste os filtros para ver mais resultados</p>
          </div>
        ) : (
          filtered.map((carga) => (
            <LoadCard
              key={carga.id}
              carga={carga}
              composicoes={composicoes}
              occupiedComposicoes={occupiedComposicoes}
              loadingId={loadingId}
              isHighlighted={highlightedId === carga.id}
              onAssign={onAssign}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))
        )}
      </div>
    </div>
  );
}
