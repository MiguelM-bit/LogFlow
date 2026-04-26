"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DocumentFilters, DocumentRecord, DocumentStatus } from "@/types";
import {
  deleteDocument,
  listDocuments,
  updateDocumentStatus,
} from "@/services/documentService";
import { getSignedUrl, deleteFile } from "@/services/storageService";
import { approveDocument, rejectDocument } from "@/services/validationService";

interface UseDocumentsOptions {
  initialDocuments?: DocumentRecord[];
  enableRealtime?: boolean;
}

interface UseDocumentsResult {
  documents: DocumentRecord[];
  filteredDocuments: DocumentRecord[];
  loading: boolean;
  actionLoadingId: string | null;
  error: string | null;
  filters: {
    loadId: string;
    driverId: string;
    status: DocumentStatus | "all";
  };
  setFilters: (next: Partial<{ loadId: string; driverId: string; status: DocumentStatus | "all" }>) => void;
  refresh: () => Promise<void>;
  setStatus: (id: string, status: DocumentStatus, reason?: string) => Promise<boolean>;
  approve: (id: string) => Promise<boolean>;
  reject: (id: string, reason: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  getDocumentUrl: (filePath: string) => Promise<string | null>;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentRecord[]>(options.initialDocuments ?? []);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<{
    loadId: string;
    driverId: string;
    status: DocumentStatus | "all";
  }>({ loadId: "all", driverId: "all", status: "all" });

  const refresh = useCallback(async () => {
    setLoading(true);
    const payload: DocumentFilters = {
      loadId: filters.loadId !== "all" ? filters.loadId : undefined,
      driverId: filters.driverId !== "all" ? filters.driverId : undefined,
      status: filters.status,
    };

    const result = await listDocuments(supabase, payload);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setDocuments(result.data);
  }, [filters.driverId, filters.loadId, filters.status]);

  useEffect(() => {
    if (!options.enableRealtime) {
      return;
    }

    const channel = supabase
      .channel("documents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [options.enableRealtime, refresh]);

  const setFilters = useCallback(
    (next: Partial<{ loadId: string; driverId: string; status: DocumentStatus | "all" }>) => {
      setFiltersState((prev) => ({ ...prev, ...next }));
    },
    []
  );

  const setStatus = useCallback(
    async (id: string, status: DocumentStatus, reason?: string): Promise<boolean> => {
      setActionLoadingId(id);
      const result = await updateDocumentStatus(supabase, id, status, reason);
      setActionLoadingId(null);

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [refresh]
  );

  const approve = useCallback(
    async (id: string): Promise<boolean> => {
      setActionLoadingId(id);
      const result = await approveDocument(supabase, id);
      setActionLoadingId(null);

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [refresh]
  );

  const reject = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      setActionLoadingId(id);
      const result = await rejectDocument(supabase, id, reason);
      setActionLoadingId(null);

      if (result.error) {
        setError(result.error);
        return false;
      }

      await refresh();
      return true;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setActionLoadingId(id);
      const result = await deleteDocument(supabase, id);

      if (result.error) {
        setActionLoadingId(null);
        setError(result.error);
        return false;
      }

      if (result.data.filePath) {
        const deleted = await deleteFile(supabase, result.data.filePath);
        if (deleted.error) {
          setActionLoadingId(null);
          setError(deleted.error);
          return false;
        }
      }

      setActionLoadingId(null);
      await refresh();
      return true;
    },
    [refresh]
  );

  const getDocumentUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const result = await getSignedUrl(supabase, filePath);
    if (result.error) {
      setError(result.error);
      return null;
    }
    return result.data;
  }, []);

  const filteredDocuments = useMemo(() => documents, [documents]);

  return {
    documents,
    filteredDocuments,
    loading,
    actionLoadingId,
    error,
    filters,
    setFilters,
    refresh,
    setStatus,
    approve,
    reject,
    remove,
    getDocumentUrl,
  };
}
