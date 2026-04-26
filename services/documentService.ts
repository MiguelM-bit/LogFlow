import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateDocumentInput,
  DocumentFilters,
  DocumentLoad,
  DocumentRecord,
  DocumentStatus,
  DocumentDriver,
} from "@/types/document.types";
import type { ServiceResult } from "@/services/types";

interface DocumentRow {
  id: string;
  load_id: string;
  driver_id: string;
  file_url: string;
  file_path: string;
  file_type: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  created_at: string;
  motoristas?: { id: string; nome: string } | Array<{ id: string; nome: string }> | null;
  cargas?:
    | { id: string; origem: string; destino: string }
    | Array<{ id: string; origem: string; destino: string }>
    | null;
}

function normalizeDocument(row: DocumentRow): DocumentRecord {
  const motorista = Array.isArray(row.motoristas)
    ? row.motoristas[0] ?? null
    : row.motoristas ?? null;

  const carga = Array.isArray(row.cargas) ? row.cargas[0] ?? null : row.cargas ?? null;

  return {
    id: row.id,
    load_id: row.load_id,
    driver_id: row.driver_id,
    file_url: row.file_url,
    file_path: row.file_path,
    file_type: row.file_type,
    status: row.status,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    driver: motorista
      ? { id: motorista.id, nome: motorista.nome }
      : null,
    load: carga
      ? {
          id: carga.id,
          origem: carga.origem,
          destino: carga.destino,
        }
      : null,
  };
}

export async function createDocument(
  supabase: SupabaseClient,
  data: CreateDocumentInput
): Promise<ServiceResult<DocumentRecord | null>> {
  const payload = {
    load_id: data.load_id,
    driver_id: data.driver_id,
    file_url: data.file_url,
    file_path: data.file_path,
    file_type: data.file_type,
    status: "pending" as const,
    rejection_reason: null,
  };

  const { data: inserted, error } = await supabase
    .from("documents")
    .insert(payload)
    .select(
      "id, load_id, driver_id, file_url, file_path, file_type, status, rejection_reason, created_at, motoristas(id, nome), cargas(id, origem, destino)"
    )
    .single();

  if (error || !inserted) {
    return { data: null, error: error?.message ?? "Erro ao criar documento." };
  }

  return { data: normalizeDocument(inserted as DocumentRow), error: null };
}

export async function getDocumentsByLoad(
  supabase: SupabaseClient,
  loadId: string
): Promise<ServiceResult<DocumentRecord[]>> {
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, load_id, driver_id, file_url, file_path, file_type, status, rejection_reason, created_at, motoristas(id, nome), cargas(id, origem, destino)"
    )
    .eq("load_id", loadId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as DocumentRow[]).map(normalizeDocument),
    error: null,
  };
}

export async function listDocuments(
  supabase: SupabaseClient,
  filters: DocumentFilters = {}
): Promise<ServiceResult<DocumentRecord[]>> {
  let query = supabase
    .from("documents")
    .select(
      "id, load_id, driver_id, file_url, file_path, file_type, status, rejection_reason, created_at, motoristas(id, nome), cargas(id, origem, destino)"
    )
    .order("created_at", { ascending: false });

  if (filters.loadId) {
    query = query.eq("load_id", filters.loadId);
  }

  if (filters.driverId) {
    query = query.eq("driver_id", filters.driverId);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as DocumentRow[]).map(normalizeDocument),
    error: null,
  };
}

export async function updateDocumentStatus(
  supabase: SupabaseClient,
  id: string,
  status: DocumentStatus,
  reason?: string | null
): Promise<ServiceResult<boolean>> {
  const payload = {
    status,
    rejection_reason: status === "rejected" ? reason?.trim() || null : null,
  };

  const { error } = await supabase.from("documents").update(payload).eq("id", id);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export async function deleteDocument(
  supabase: SupabaseClient,
  id: string
): Promise<ServiceResult<{ filePath: string | null }>> {
  const { data: row, error: findError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (findError) {
    return { data: { filePath: null }, error: findError.message };
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return { data: { filePath: null }, error: error.message };
  }

  return {
    data: { filePath: (row as { file_path: string }).file_path ?? null },
    error: null,
  };
}

export async function listDocumentLoads(
  supabase: SupabaseClient
): Promise<ServiceResult<DocumentLoad[]>> {
  const { data, error } = await supabase
    .from("cargas")
    .select("id, origem, destino")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as Array<{ id: string; origem: string; destino: string }>).map(
      (row) => ({ id: row.id, origem: row.origem, destino: row.destino })
    ),
    error: null,
  };
}

export async function listDocumentDrivers(
  supabase: SupabaseClient
): Promise<ServiceResult<DocumentDriver[]>> {
  const { data, error } = await supabase
    .from("motoristas")
    .select("id, nome")
    .order("nome", { ascending: true })
    .limit(300);

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as Array<{ id: string; nome: string }>).map((row) => ({
      id: row.id,
      nome: row.nome,
    })),
    error: null,
  };
}
