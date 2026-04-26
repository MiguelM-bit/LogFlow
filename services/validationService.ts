import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceResult } from "@/services/types";
import { updateDocumentStatus } from "@/services/documentService";

export async function approveDocument(
  supabase: SupabaseClient,
  id: string
): Promise<ServiceResult<boolean>> {
  return updateDocumentStatus(supabase, id, "approved", null);
}

export async function rejectDocument(
  supabase: SupabaseClient,
  id: string,
  reason: string
): Promise<ServiceResult<boolean>> {
  const normalizedReason = reason.trim();

  if (!normalizedReason) {
    return { data: false, error: "Informe o motivo da rejeição." };
  }

  return updateDocumentStatus(supabase, id, "rejected", normalizedReason);
}
