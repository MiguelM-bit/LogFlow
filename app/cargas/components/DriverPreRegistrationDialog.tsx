"use client";

import { useState } from "react";
import { formatCPF } from "@/services/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DriverPreRegistrationDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: { name: string; cpf: string }) => Promise<void>;
}

export function DriverPreRegistrationDialog({
  open,
  loading,
  onClose,
  onConfirm,
}: DriverPreRegistrationDialogProps) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");

  async function handleConfirm() {
    await onConfirm({ name: name.trim(), cpf: cpf.trim() });
    setName("");
    setCpf("");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pré-cadastro de motorista</DialogTitle>
          <DialogDescription>
            Para fechar a carga, informe nome e CPF para criar um motorista com perfil incompleto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do motorista" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">CPF</label>
            <Input
              value={cpf}
              onChange={(event) => setCpf(formatCPF(event.target.value))}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={loading || !name.trim() || cpf.trim().length < 11}
            >
              {loading ? "Fechando..." : "Salvar e fechar carga"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
