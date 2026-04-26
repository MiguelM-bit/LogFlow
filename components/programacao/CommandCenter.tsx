"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Composicao, ProgramacaoCargaComSLA } from "@/types";
import { useScheduling } from "@/hooks/useScheduling";
import { PriorityPanel } from "./PriorityPanel";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { LoadList } from "./LoadList";
import { LoadDetailsDrawer } from "./LoadDetailsDrawer";
import type { ActionSuggestion } from "@/services/schedulingService";

// Dynamically import MapView to avoid SSR (Leaflet requires window)
const MapView = dynamic(
  () => import("./MapView").then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-500">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
);

interface CommandCenterProps {
  initialCargas: ProgramacaoCargaComSLA[];
  initialComposicoes: Composicao[];
}

export function CommandCenter({ initialCargas, initialComposicoes }: CommandCenterProps) {
  const {
    cargas,
    composicoes,
    criticalCargas,
    suggestions,
    occupiedComposicoes,
    loadingId,
    error,
    feedback,
    assign,
    remove,
  } = useScheduling(initialCargas, initialComposicoes);

  const [selectedLoad, setSelectedLoad] = useState<ProgramacaoCargaComSLA | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleApplySuggestion = (suggestion: ActionSuggestion) => {
    if (suggestion.type === "assign_driver" && suggestion.composicaoId) {
      void assign(suggestion.cargaIds[0], suggestion.composicaoId);
    } else if (suggestion.type === "group_loads") {
      // Open drawer for first load in group
      const target = cargas.find((c) => c.id === suggestion.cargaIds[0]);
      if (target) setSelectedLoad(target);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toast messages */}
      {(feedback || error) && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            feedback
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback ?? error}
        </div>
      )}

      {/* Layer 1: Priority Panel */}
      <PriorityPanel
        criticalCargas={criticalCargas}
        composicoes={composicoes}
        occupiedComposicoes={occupiedComposicoes}
        loadingId={loadingId}
        onAssign={(cargaId, composicaoId) => void assign(cargaId, composicaoId)}
        onSelectLoad={setSelectedLoad}
      />

      {/* Layer 2: Suggestions Panel */}
      <SuggestionsPanel
        suggestions={suggestions}
        onApplySuggestion={handleApplySuggestion}
      />

      {/* Layer 3: Split view — LoadList (left) + MapView (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0" style={{ minHeight: "520px" }}>
        {/* Load list */}
        <div className="flex flex-col min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Cargas Operacionais</h2>
            <p className="text-xs text-slate-500">Ordenadas por prioridade e SLA</p>
          </div>
          <div className="flex-1 min-h-0">
            <LoadList
              cargas={cargas}
              composicoes={composicoes}
              occupiedComposicoes={occupiedComposicoes}
              loadingId={loadingId}
              highlightedId={hoveredId}
              onAssign={(cargaId, composicaoId) => void assign(cargaId, composicaoId)}
              onSelect={setSelectedLoad}
              onHover={setHoveredId}
            />
          </div>
        </div>

        {/* Map */}
        <div className="min-h-[400px] lg:min-h-0">
          <MapView
            cargas={cargas}
            highlightedId={hoveredId}
            onSelectLoad={setSelectedLoad}
            onHover={setHoveredId}
          />
        </div>
      </div>

      {/* Detail drawer */}
      {selectedLoad && (
        <LoadDetailsDrawer
          carga={selectedLoad}
          composicoes={composicoes}
          occupiedComposicoes={occupiedComposicoes}
          loadingId={loadingId}
          onClose={() => setSelectedLoad(null)}
          onAssign={(cargaId, composicaoId) => {
            void assign(cargaId, composicaoId).then(() => setSelectedLoad(null));
          }}
          onRemove={(cargaId) => {
            void remove(cargaId).then(() => setSelectedLoad(null));
          }}
        />
      )}
    </div>
  );
}
