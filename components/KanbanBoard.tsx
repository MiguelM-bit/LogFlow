"use client";

import { useEffect, useMemo, useState } from "react";
import { DatabaseLoad, Load, KanbanData, LoadStatus } from "@/types";
import { mapDatabaseLoad, mapUiStatusToDatabase, organizeLoadsByStatus } from "@/lib/cargas";
import { supabase } from "@/lib/supabase";
import { KanbanColumn } from "./KanbanColumn";
import { AddLoadModal } from "./AddLoadModal";
import { Plus } from "lucide-react";

interface KanbanBoardProps {
  initialLoads?: Load[];
  allowCreate?: boolean;
}

const statusOrder: LoadStatus[] = ["available", "negotiating", "scheduled", "completed"];

export function KanbanBoard({ initialLoads = [], allowCreate = false }: KanbanBoardProps) {
  const [loads, setLoads] = useState<Load[]>(initialLoads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [draggedLoadId, setDraggedLoadId] = useState<string | null>(null);
  const [updatingLoadIds, setUpdatingLoadIds] = useState<Set<string>>(new Set());

  // Keeps the board data derived from source loads state.
  const organized: KanbanData = useMemo(
    () => organizeLoadsByStatus(loads),
    [loads]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchLoads = async () => {
      const { data, error } = await supabase
        .from("cargas")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        setFetchError(error.message);
        console.error("Erro ao buscar cargas:", error.message);
      } else {
        setFetchError(null);
      }

      if (isMounted && data) {
        setLoads(data.map((row) => mapDatabaseLoad(row as DatabaseLoad)));
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    void fetchLoads();

    const channel = supabase
      .channel("cargas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargas" },
        (payload) => {
          setLoads((prevLoads) => {
            if (payload.eventType === "DELETE") {
              const deletedId = String(payload.old.id);
              return prevLoads.filter((load) => load.id !== deletedId);
            }

            const record = payload.new as DatabaseLoad;
            const mappedLoad = mapDatabaseLoad(record);
            const existingIndex = prevLoads.findIndex((load) => load.id === mappedLoad.id);

            if (existingIndex === -1) {
              return [mappedLoad, ...prevLoads];
            }

            const nextLoads = [...prevLoads];
            nextLoads[existingIndex] = mappedLoad;
            return nextLoads;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const updateLoadStatus = async (loadId: string, nextStatus: LoadStatus) => {
    const previousLoads = loads;

    setUpdatingLoadIds((prev) => new Set(prev).add(loadId));
    setLoads((prevLoads) =>
      prevLoads.map((load) =>
        load.id === loadId
          ? {
              ...load,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : load
      )
    );

    const { error } = await supabase
      .from("cargas")
      .update({
        status: mapUiStatusToDatabase(nextStatus),
        updated_at: new Date().toISOString(),
      })
      .eq("id", loadId);

    setUpdatingLoadIds((prev) => {
      const clone = new Set(prev);
      clone.delete(loadId);
      return clone;
    });

    if (error) {
      console.error("Erro ao atualizar status:", error.message);
      setLoads(previousLoads);
    }
  };

  const handleDragStart = (loadId: string) => {
    setDraggedLoadId(loadId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (
    event: React.DragEvent,
    targetStatus: LoadStatus
  ) => {
    event.preventDefault();

    if (!draggedLoadId) {
      return;
    }

    const draggedLoad = loads.find((load) => load.id === draggedLoadId);
    setDraggedLoadId(null);

    if (!draggedLoad || draggedLoad.status === targetStatus) {
      return;
    }

    await updateLoadStatus(draggedLoad.id, targetStatus);
  };

  const moveLoadToNextStatus = async (load: Load) => {
    const currentStatusIndex = statusOrder.indexOf(load.status);
    const nextStatus = statusOrder[currentStatusIndex + 1];

    if (!nextStatus) {
      return;
    }

    await updateLoadStatus(load.id, nextStatus);
  };

  const handleAddLoad = (newLoad: Omit<Load, "id" | "createdAt" | "updatedAt">) => {
    const load: Load = {
      ...newLoad,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoads((prevLoads) => [...prevLoads, load]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quadro de Cargas</h1>
          <p className="text-gray-600 mt-1">
            Total de cargas: <span className="font-semibold">{loads.length}</span>
          </p>
        </div>
        {allowCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Carga
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {loading ? (
          <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
            Carregando cargas do Supabase...
          </div>
        ) : fetchError ? (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Falha ao carregar cargas do Supabase: {fetchError}
          </div>
        ) : loads.length === 0 ? (
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Nenhuma carga retornada pela tabela <strong>cargas</strong>. Se voce esperava dados, verifique se existem registros e se as policies RLS permitem SELECT/UPDATE para o papel utilizado.
          </div>
        ) : (
          <>
        <KanbanColumn
          title="Disponível"
          status="available"
          loads={organized.available}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMoveToNextStatus={moveLoadToNextStatus}
          updatingLoadIds={updatingLoadIds}
        />
        <KanbanColumn
          title="Em Negociação"
          status="negotiating"
          loads={organized.negotiating}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMoveToNextStatus={moveLoadToNextStatus}
          updatingLoadIds={updatingLoadIds}
        />
        <KanbanColumn
          title="Programada"
          status="scheduled"
          loads={organized.scheduled}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMoveToNextStatus={moveLoadToNextStatus}
          updatingLoadIds={updatingLoadIds}
        />
        <KanbanColumn
          title="Concluída"
          status="completed"
          loads={organized.completed}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMoveToNextStatus={moveLoadToNextStatus}
          updatingLoadIds={updatingLoadIds}
        />
          </>
        )}
      </div>

      {allowCreate && (
        <AddLoadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddLoad={handleAddLoad}
        />
      )}
    </div>
  );
}
