"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter, Plus } from "lucide-react";
import type { CloseLoadAssignmentInput, LoadRecord, LoadStatus } from "@/app/cargas/types/contracts";
import { useLoads } from "@/app/cargas/hooks/useLoads";
import { useDebouncedValue } from "@/app/cargas/utils/filters";
import { CargasTabs } from "@/app/cargas/components/CargasTabs";
import { CargasTable } from "@/app/cargas/components/CargasTable";
import { LoadFormDialog } from "@/app/cargas/components/LoadFormDialog";
import { CloseLoadAssignmentDialog } from "@/app/cargas/components/CloseLoadAssignmentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CargasPageClientProps {
  initialLoads: LoadRecord[];
}

interface PendingStatusUpdate {
  loadId: string;
  status: LoadStatus;
}

interface FilterState {
  cliente: string;
  perfil: string;
  origin: string;
  destination: string;
}

function countByStatus(loads: LoadRecord[]) {
  return {
    em_aberto: loads.filter((load) => load.status === "em_aberto").length,
    em_negociacao: loads.filter((load) => load.status === "em_negociacao").length,
    fechada: loads.filter((load) => load.status === "fechada").length,
    cancelada: loads.filter((load) => load.status === "cancelada").length,
  };
}

export function CargasPageClient({ initialLoads }: CargasPageClientProps) {
  const [activeTab, setActiveTab] = useState<LoadStatus>("em_aberto");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<LoadRecord | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingStatusUpdate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterInputs, setFilterInputs] = useState<FilterState>({
    cliente: "",
    perfil: "",
    origin: "",
    destination: "",
  });

  const debouncedCliente = useDebouncedValue(filterInputs.cliente, 300);
  const debouncedPerfil = useDebouncedValue(filterInputs.perfil, 300);
  const debouncedOrigin = useDebouncedValue(filterInputs.origin, 300);
  const debouncedDestination = useDebouncedValue(filterInputs.destination, 300);

  const activeFilterCount = [filterInputs.cliente, filterInputs.perfil, filterInputs.origin, filterInputs.destination]
    .filter(Boolean).length;

  const {
    loads,
    loading,
    creating,
    updatingId,
    loadingStatusId,
    error,
    success,
    setFilters,
    create,
    update,
    changeStatus,
  } = useLoads(initialLoads);

  useEffect(() => {
    setFilters({
      cliente: debouncedCliente || undefined,
      perfil: debouncedPerfil || undefined,
      origin: debouncedOrigin || undefined,
      destination: debouncedDestination || undefined,
    });
  }, [debouncedCliente, debouncedPerfil, debouncedOrigin, debouncedDestination, setFilters]);

  const counts = useMemo(() => countByStatus(loads), [loads]);
  const loadsByTab = useMemo(
    () => loads.filter((load) => load.status === activeTab),
    [loads, activeTab]
  );

  async function handleCreateOrUpdate(payload: {
    origin: string;
    destination: string;
    price: number;
    status: LoadStatus;
    cliente?: string | null;
    perfil?: string | null;
    horarioColeta?: string | null;
    horarioDescarga?: string | null;
  }): Promise<boolean> {
    const ok = editingLoad
      ? await update(editingLoad.id, payload)
      : await create(payload);

    if (ok) {
      setIsFormOpen(false);
      setEditingLoad(null);
    }

    return ok;
  }

  function handleEdit(load: LoadRecord) {
    setEditingLoad(load);
    setIsFormOpen(true);
  }

  async function handleStatusChange(load: LoadRecord, nextStatus: LoadStatus) {
    if (nextStatus === load.status) {
      return;
    }

    if (nextStatus === "fechada") {
      setPendingStatus({ loadId: load.id, status: nextStatus });
      return;
    }

    await changeStatus(load.id, nextStatus);
  }

  async function handleConfirmCloseAssignment(payload: CloseLoadAssignmentInput) {
    if (!pendingStatus) {
      return;
    }

    const ok = await changeStatus(pendingStatus.loadId, pendingStatus.status, payload);
    if (ok) {
      setPendingStatus(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Módulo de Cargas</h1>
            <p className="text-sm text-slate-500">
              Gestão independente com CRUD, status visual e pré-cadastro de motorista no fechamento.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingLoad(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova Carga
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CargasTabs active={activeTab} counts={counts} onChange={setActiveTab} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {showFilters ? (
          <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Cliente</label>
              <Input
                value={filterInputs.cliente}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, cliente: e.target.value }))}
                placeholder="Buscar por cliente"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Perfil</label>
              <Input
                value={filterInputs.perfil}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, perfil: e.target.value }))}
                placeholder="Buscar por perfil"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Origem</label>
              <Input
                value={filterInputs.origin}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, origin: e.target.value }))}
                placeholder="Buscar por origem"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Destino</label>
              <Input
                value={filterInputs.destination}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, destination: e.target.value }))}
                placeholder="Buscar por destino"
                className="h-8 text-sm"
              />
            </div>
          </div>
        ) : null}
      </section>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ) : loadsByTab.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nenhuma carga encontrada para os filtros atuais.
        </div>
      ) : (
        <CargasTable
          loads={loadsByTab}
          loadingStatusId={loadingStatusId}
          updatingId={updatingId}
          onEdit={handleEdit}
          onStatusChange={(load, status) => void handleStatusChange(load, status)}
        />
      )}

      <LoadFormDialog
        open={isFormOpen}
        submitting={creating || Boolean(updatingId)}
        load={editingLoad}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLoad(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <CloseLoadAssignmentDialog
        open={Boolean(pendingStatus)}
        loading={Boolean(loadingStatusId)}
        onClose={() => setPendingStatus(null)}
        onConfirm={handleConfirmCloseAssignment}
      />
    </div>
  );
}
