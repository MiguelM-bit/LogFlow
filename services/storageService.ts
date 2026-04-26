import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceResult } from "@/services/types";

const DOCUMENT_BUCKET = "documents";
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface FileValidationConfig {
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
}

export function validateFile(
  file: File,
  config: FileValidationConfig = {}
): ServiceResult<true> {
  const maxSize = config.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
  const allowedTypes = config.allowedMimeTypes ?? ALLOWED_MIME_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      data: true,
      error: `Tipo de arquivo não permitido (${file.type || "desconhecido"}).`,
    };
  }

  if (file.size > maxSize) {
    return {
      data: true,
      error: `Arquivo excede o limite de ${Math.floor(maxSize / (1024 * 1024))}MB.`,
    };
  }

  return { data: true, error: null };
}

export async function uploadFile(
  supabase: SupabaseClient,
  file: File,
  path: string
): Promise<ServiceResult<{ path: string; fileUrl: string }>> {
  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    return { data: { path: "", fileUrl: "" }, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from(DOCUMENT_BUCKET)
    .getPublicUrl(path);

  return {
    data: {
      path,
      fileUrl: publicUrlData.publicUrl,
    },
    error: null,
  };
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 3600
): Promise<ServiceResult<string>> {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return {
      data: "",
      error: error?.message ?? "Não foi possível gerar URL assinada.",
    };
  }

  return { data: data.signedUrl, error: null };
}

export function getPublicUrl(
  supabase: SupabaseClient,
  path: string
): ServiceResult<string> {
  const { data } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(path);
  return { data: data.publicUrl, error: null };
}

export async function deleteFile(
  supabase: SupabaseClient,
  path: string
): Promise<ServiceResult<boolean>> {
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

export { ALLOWED_MIME_TYPES, DOCUMENT_BUCKET, MAX_FILE_SIZE_BYTES };
