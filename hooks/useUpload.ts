"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DocumentRecord } from "@/types";
import { createDocument } from "@/services/documentService";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  uploadFile,
  validateFile,
} from "@/services/storageService";

interface UploadPayload {
  file: File;
  loadId: string;
  driverId: string;
  fileType: string;
}

interface UseUploadResult {
  uploading: boolean;
  error: string | null;
  success: string | null;
  uploadDocument: (payload: UploadPayload) => Promise<DocumentRecord | null>;
  resetFeedback: () => void;
}

async function compressImage(file: File, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.type === "image/gif") {
    return file;
  }

  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxWidth = 1920;
  const maxHeight = 1920;
  const ratio = Math.min(maxWidth / imageBitmap.width, maxHeight / imageBitmap.height, 1);

  canvas.width = Math.round(imageBitmap.width * ratio);
  canvas.height = Math.round(imageBitmap.height * ratio);

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob) {
    return file;
  }

  if (blob.size >= file.size) {
    return file;
  }

  const extension = outputType === "image/png" ? "png" : "jpg";

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

function buildStoragePath(driverId: string, loadId: string, file: File) {
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");

  return `${driverId}/${loadId}/${Date.now()}-${safeName}`;
}

export function useUpload(): UseUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const uploadDocument = useCallback(async (payload: UploadPayload) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    const validation = validateFile(payload.file, {
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (validation.error) {
      setUploading(false);
      setError(validation.error);
      return null;
    }

    try {
      const compressedFile = await compressImage(payload.file);
      const path = buildStoragePath(payload.driverId, payload.loadId, compressedFile);

      const uploadResult = await uploadFile(supabase, compressedFile, path);
      if (uploadResult.error) {
        setError(uploadResult.error);
        return null;
      }

      const createResult = await createDocument(supabase, {
        load_id: payload.loadId,
        driver_id: payload.driverId,
        file_path: uploadResult.data.path,
        file_url: uploadResult.data.fileUrl,
        file_type: payload.fileType,
      });

      if (createResult.error || !createResult.data) {
        setError(createResult.error ?? "Não foi possível registrar o documento.");
        return null;
      }

      setSuccess("Documento enviado com sucesso.");
      return createResult.data;
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Falha inesperada no upload.";
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    error,
    success,
    uploadDocument,
    resetFeedback,
  };
}
