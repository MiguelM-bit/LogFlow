"use client";

import type { LoadRecord } from "@/app/cargas/types/contracts";
import { LoadForm } from "@/app/cargas/components/LoadForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoadFormDialogProps {
  open: boolean;
  submitting: boolean;
  load?: LoadRecord | null;
  onClose: () => void;
  onSubmit: (payload: {
    origin: string;
    destination: string;
    price: number;
    status: "em_aberto" | "em_negociacao" | "fechada" | "cancelada";
  }) => Promise<boolean>;
}

export function LoadFormDialog({
  open,
  submitting,
  load,
  onClose,
  onSubmit,
}: LoadFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{load ? "Editar carga" : "Nova carga"}</DialogTitle>
          <DialogDescription>
            {load
              ? "Atualize os dados operacionais da carga."
              : "Cadastre uma nova carga no módulo independente de Cargas."}
          </DialogDescription>
        </DialogHeader>

        <LoadForm initialLoad={load} submitting={submitting} onSubmit={onSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
