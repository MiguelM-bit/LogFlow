"use client";

import Image from "next/image";
import { Download, Eye, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentActions } from "@/components/document/DocumentActions";
import type { DocumentRecord } from "@/types";

interface DocumentCardProps {
  document: DocumentRecord;
  previewUrl: string | null;
  loading: boolean;
  onPreview: () => Promise<void>;
  onDownload: () => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

function statusBadge(status: DocumentRecord["status"]) {
  if (status === "approved") {
    return <Badge variant="success">Aprovado</Badge>;
  }

  if (status === "rejected") {
    return <Badge variant="danger">Rejeitado</Badge>;
  }

  return <Badge variant="warning">Pendente</Badge>;
}

export function DocumentCard({
  document,
  previewUrl,
  loading,
  onPreview,
  onDownload,
  onApprove,
  onReject,
}: DocumentCardProps) {
  const createdAt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(document.created_at));

  return (
    <Card className="rounded-[16px]">
      <CardHeader className="mb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{document.file_type}</CardTitle>
          {statusBadge(document.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="relative aspect-[4/3] w-full">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Documento"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 33vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Sem preview
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-700">Motorista:</span>{" "}
            {document.driver?.nome ?? "Não informado"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Viagem:</span>{" "}
            {document.load?.origem ?? "Origem"} → {document.load?.destino ?? "Destino"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Enviado em:</span> {createdAt}
          </p>
        </div>

        {document.status === "rejected" && document.rejection_reason && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <FileWarning className="mr-1 inline h-3.5 w-3.5" />
            Motivo: {document.rejection_reason}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => void onPreview()}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void onDownload()}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        <DocumentActions
          status={document.status}
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      </CardContent>
    </Card>
  );
}
