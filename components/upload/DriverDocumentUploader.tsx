"use client";

import Image from "next/image";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CameraInput } from "@/components/upload/CameraInput";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCamera } from "@/hooks/useCamera";
import { useUpload } from "@/hooks/useUpload";
import type { DocumentDriver, DocumentLoad } from "@/types";

interface DriverDocumentUploaderProps {
  loads: DocumentLoad[];
  drivers: DocumentDriver[];
  defaultDriverId?: string;
}

export function DriverDocumentUploader({
  loads,
  drivers,
  defaultDriverId,
}: DriverDocumentUploaderProps) {
  const { selectedFile, previewUrl, setFile, clear } = useCamera();
  const { uploadDocument, uploading, error, success, resetFeedback } = useUpload();
  const [loadId] = useState(loads[0]?.id ?? "");
  const [driverId] = useState(defaultDriverId ?? drivers[0]?.id ?? "");
  const [fileType, setFileType] = useState("comprovante");
  const [confirmedPreview, setConfirmedPreview] = useState(false);

  const canUpload = Boolean(selectedFile && loadId && driverId && fileType);
  const readyToSend = Boolean(canUpload && confirmedPreview);

  const selectedLoad = useMemo(
    () => loads.find((item) => item.id === loadId) ?? null,
    [loads, loadId]
  );

  const selectedDriver = useMemo(
    () => drivers.find((item) => item.id === driverId) ?? null,
    [driverId, drivers]
  );

  const tripLabel = selectedLoad
    ? `Viagem ${selectedLoad.id.slice(0, 8).toUpperCase()}`
    : "Sem viagem disponível";

  const handleSend = async () => {
    if (!selectedFile || !readyToSend) {
      return;
    }

    const result = await uploadDocument({
      file: selectedFile,
      loadId,
      driverId,
      fileType,
    });

    if (result) {
      clear();
      setFileType("comprovante");
      setConfirmedPreview(false);
    }
  };

  const handleFileSelect = (file: File) => {
    resetFeedback();
    setConfirmedPreview(false);
    setFile(file);
  };

  const handleRetry = () => {
    resetFeedback();
    setConfirmedPreview(false);
    clear();
  };

  const isUnavailable = !selectedLoad || !selectedDriver;

  return (
    <section className="space-y-6 animate-fadeIn">
      <header className="space-y-3 rounded-[16px] border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-slate-900">LOGFLOW</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{tripLabel}</p>
          </div>
          <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            {selectedDriver?.nome ?? "Motorista"}
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {selectedLoad ? `${selectedLoad.origem} → ${selectedLoad.destino}` : "Aguardando viagem"}
        </p>
      </header>

      <div className="space-y-4 rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm">
        {!previewUrl ? (
          <div className="space-y-4">
            <CameraInput
              disabled={uploading || isUnavailable}
              label="📷 Tirar foto"
              className="h-16 w-full rounded-[16px] bg-primary-500 text-lg font-black text-white shadow-sm hover:bg-primary-600"
              onFileSelect={handleFileSelect}
            />

            <FileUpload
              disabled={uploading || isUnavailable}
              label="📁 Enviar da galeria"
              className="h-12 w-full rounded-[16px] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
              onFileSelect={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4" style={{ animation: "fadeIn 0.28s ease-out" }}>
            <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-100 shadow-inner">
              <div className="aspect-[4/5] w-full bg-slate-100">
                {selectedFile?.type === "application/pdf" ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600">
                    PDF selecionado: {selectedFile.name}
                  </div>
                ) : (
                  <Image
                    src={previewUrl}
                    alt="Prévia do documento"
                    width={1200}
                    height={1500}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de documento</p>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="h-12 rounded-[16px] text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                  <SelectItem value="comprovante">Comprovante</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-[16px] text-sm font-semibold"
                disabled={uploading}
                onClick={handleRetry}
              >
                <RotateCcw className="h-4 w-4" />
                Refazer
              </Button>
              <Button
                type="button"
                variant={confirmedPreview ? "success" : "secondary"}
                className="h-12 rounded-[16px] text-sm font-semibold"
                disabled={uploading}
                onClick={() => setConfirmedPreview(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar envio
              </Button>
            </div>

            <Button
              type="button"
              size="lg"
              className="h-14 w-full rounded-[16px] text-base font-black uppercase tracking-wide"
              disabled={!readyToSend || uploading}
              onClick={() => void handleSend()}
            >
              {uploading ? "⏳ Enviando..." : "ENVIAR DOCUMENTO"}
            </Button>
          </div>
        )}

        {isUnavailable && (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Viagem ou motorista indisponível no momento.
          </p>
        )}

        {error && (
          <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 animate-fadeIn">
            ❌ {error}
          </p>
        )}

        {success && (
          <div
            className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            style={{ animation: "popIn 0.28s ease-out" }}
          >
            ✅ Enviado com sucesso
          </div>
        )}
      </div>
    </section>
  );
}
