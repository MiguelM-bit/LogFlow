"use client";

import { useMemo, useState } from "react";
import { DocumentCard } from "@/components/document/DocumentCard";
import { DocumentPreviewModal } from "@/components/document/DocumentPreviewModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentDriver, DocumentLoad, DocumentRecord, DocumentStatus } from "@/types";

interface DocumentListProps {
  initialDocuments: DocumentRecord[];
  loads: DocumentLoad[];
  drivers: DocumentDriver[];
}

export function DocumentList({ initialDocuments, loads, drivers }: DocumentListProps) {
  const {
    filteredDocuments,
    loading,
    actionLoadingId,
    error,
    filters,
    setFilters,
    refresh,
    approve,
    reject,
    getDocumentUrl,
  } = useDocuments({ initialDocuments, enableRealtime: true });

  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const hasDocuments = filteredDocuments.length > 0;

  const summary = useMemo(() => {
    const pending = filteredDocuments.filter((item) => item.status === "pending").length;
    const approved = filteredDocuments.filter((item) => item.status === "approved").length;
    const rejected = filteredDocuments.filter((item) => item.status === "rejected").length;

    return { pending, approved, rejected };
  }, [filteredDocuments]);

  const openPreview = async (document: DocumentRecord) => {
    const url = await getDocumentUrl(document.file_path);
    if (!url) return;
    setActiveDocument(document);
    setActiveUrl(url);
    setModalOpen(true);
  };

  const handleDownload = async (document: DocumentRecord) => {
    const url = await getDocumentUrl(document.file_path);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pendente</p>
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Aprovado</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.approved}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rejeitado</p>
          <p className="text-2xl font-bold text-rose-600">{summary.rejected}</p>
        </div>

        <div className="lg:col-span-2 lg:justify-self-end">
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar lista"}
          </Button>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Filtro por viagem</p>
          <Select value={filters.loadId} onValueChange={(value) => setFilters({ loadId: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {loads.map((load) => (
                <SelectItem key={load.id} value={load.id}>
                  {load.origem} → {load.destino}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Filtro por status</p>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters({ status: value as DocumentStatus | "all" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Filtro por motorista</p>
          <Select value={filters.driverId} onValueChange={(value) => setFilters({ driverId: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!hasDocuments && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum documento encontrado para os filtros selecionados.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            previewUrl={document.file_type === "application/pdf" ? null : document.file_url}
            loading={actionLoadingId === document.id}
            onPreview={async () => {
              await openPreview(document);
            }}
            onDownload={async () => {
              await handleDownload(document);
            }}
            onApprove={async () => {
              await approve(document.id);
            }}
            onReject={async (reason) => {
              await reject(document.id, reason);
            }}
          />
        ))}
      </section>

      <DocumentPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        document={activeDocument}
        imageUrl={activeUrl}
        onDownload={async () => {
          if (!activeDocument) return;
          await handleDownload(activeDocument);
        }}
      />
    </div>
  );
}
