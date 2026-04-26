"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DocumentRecord } from "@/types";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentRecord | null;
  imageUrl: string | null;
  onDownload: () => Promise<void>;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  imageUrl,
  onDownload,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setZoom(1);
    }
    onOpenChange(nextOpen);
  };

  if (!document) {
    return null;
  }

  const canRenderImage = document.file_type !== "application/pdf";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4">
          <DialogTitle>Documento da viagem</DialogTitle>
          <DialogDescription>
            {document.load?.origem ?? "Origem"} → {document.load?.destino ?? "Destino"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setZoom((current) => Math.max(0.5, current - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
                Zoom-
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setZoom((current) => Math.min(2.5, current + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
                Zoom+
              </Button>
            </div>

            <Button type="button" size="sm" onClick={() => void onDownload()}>
              <Download className="h-4 w-4" />
              Baixar
            </Button>
          </div>

          <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            {canRenderImage && imageUrl ? (
              <Image
                src={imageUrl}
                alt="Preview do documento"
                width={1400}
                height={1000}
                unoptimized
                className="mx-auto origin-top transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <div className="flex min-h-48 items-center justify-center text-sm text-slate-600">
                Pré-visualização indisponível para este formato. Use download para abrir o arquivo.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
