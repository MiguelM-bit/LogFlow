"use client";

import { useCallback, useRef, useState } from "react";

export interface UseCameraResult {
  selectedFile: File | null;
  previewUrl: string | null;
  setFile: (file: File | null) => void;
  clear: () => void;
}

export function useCamera(): UseCameraResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const setFile = useCallback((file: File | null) => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    previewRef.current = nextPreview;
    setPreviewUrl(nextPreview);
  }, []);

  const clear = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  return {
    selectedFile,
    previewUrl,
    setFile,
    clear,
  };
}
