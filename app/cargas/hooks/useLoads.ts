"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateLoadDTO,
  DriverPreRegistrationInput,
  ListLoadsFilters,
  LoadRecord,
  LoadStatus,
  UpdateLoadDTO,
} from "@/app/cargas/types/contracts";
import { createClient } from "@/utils/supabase/client";
import {
  createLoad,
  listLoads,
  updateLoad,
  updateLoadStatus,
} from "@/app/cargas/services/loadService";
import { createOrGetPreRegisteredDriver } from "@/app/cargas/services/driverPreRegistrationService";

interface UseLoadsResult {
  loads: LoadRecord[];
  loading: boolean;
  loadingStatusId: string | null;
  creating: boolean;
  updatingId: string | null;
  error: string | null;
  success: string | null;
  setFilters: (filters: ListLoadsFilters) => void;
  refresh: () => Promise<void>;
  create: (payload: CreateLoadDTO) => Promise<boolean>;
  update: (loadId: string, payload: UpdateLoadDTO) => Promise<boolean>;
  changeStatus: (
    loadId: string,
    nextStatus: LoadStatus,
    preRegistration?: DriverPreRegistrationInput
  ) => Promise<boolean>;
}

export function useLoads(initialLoads: LoadRecord[]): UseLoadsResult {
  const supabase = useMemo(() => createClient(), []);
  const [loads, setLoads] = useState<LoadRecord[]>(initialLoads);
  const [filters, setFiltersState] = useState<ListLoadsFilters>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setFilters = useCallback((next: ListLoadsFilters) => {
    setFiltersState(next);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await listLoads(supabase, filters);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setLoads(result.data);
  }, [supabase, filters]);

  const create = useCallback(
    async (payload: CreateLoadDTO): Promise<boolean> => {
      setCreating(true);
      const result = await createLoad(supabase, payload);
      setCreating(false);

      if (result.error) {
        setError(result.error);
        return false;
      }

      setSuccess("Carga criada com sucesso.");
      await refresh();
      return true;
    },
    [supabase, refresh]
  );

  const update = useCallback(
    async (loadId: string, payload: UpdateLoadDTO): Promise<boolean> => {
      setUpdatingId(loadId);
      const result = await updateLoad(supabase, loadId, payload);
      setUpdatingId(null);

      if (result.error) {
        setError(result.error);
        return false;
      }

      setSuccess("Carga atualizada com sucesso.");
      await refresh();
      return true;
    },
    [supabase, refresh]
  );

  const changeStatus = useCallback(
    async (
      loadId: string,
      nextStatus: LoadStatus,
      preRegistration?: DriverPreRegistrationInput
    ): Promise<boolean> => {
      const previous = loads;

      setLoadingStatusId(loadId);
      setLoads((current) =>
        current.map((load) =>
          load.id === loadId
            ? { ...load, status: nextStatus, updatedAt: new Date().toISOString() }
            : load
        )
      );

      let driverId: string | undefined;

      if (nextStatus === "fechada" && preRegistration) {
        const pre = await createOrGetPreRegisteredDriver(supabase, preRegistration);
        if (pre.error || !pre.data) {
          setLoadingStatusId(null);
          setLoads(previous);
          setError(pre.error ?? "Não foi possível criar o pré-cadastro de motorista.");
          return false;
        }
        driverId = pre.data.id;
      }

      const result = await updateLoadStatus(supabase, loadId, nextStatus, driverId);
      setLoadingStatusId(null);

      if (result.error) {
        setLoads(previous);
        setError(result.error);
        return false;
      }

      setSuccess("Status atualizado.");
      await refresh();
      return true;
    },
    [supabase, loads, refresh]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  return {
    loads,
    loading,
    loadingStatusId,
    creating,
    updatingId,
    error,
    success,
    setFilters,
    refresh,
    create,
    update,
    changeStatus,
  };
}
