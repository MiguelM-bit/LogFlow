"use client";

import type { LoadRecord } from "@/app/cargas/types/contracts";
import { useLoadForm } from "@/app/cargas/hooks/useLoadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoadFormProps {
  initialLoad?: LoadRecord | null;
  submitting: boolean;
  onSubmit: (payload: {
    origin: string;
    destination: string;
    price: number;
    status: "em_aberto" | "em_negociacao" | "fechada" | "cancelada";
  }) => Promise<boolean>;
  onCancel: () => void;
}

export function LoadForm({ initialLoad, submitting, onSubmit, onCancel }: LoadFormProps) {
  const formApi = useLoadForm(initialLoad ?? null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dto = formApi.toDTO();

    if (!dto) {
      return;
    }

    const success = await onSubmit(dto);
    if (success && !initialLoad) {
      formApi.reset();
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Origem</label>
          <Input
            value={formApi.form.origin}
            onChange={(event) => formApi.patch("origin", event.target.value)}
            placeholder="Ex: São Paulo, SP"
          />
          {formApi.errors.origin ? (
            <p className="text-xs text-rose-600">{formApi.errors.origin}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Destino</label>
          <Input
            value={formApi.form.destination}
            onChange={(event) => formApi.patch("destination", event.target.value)}
            placeholder="Ex: Curitiba, PR"
          />
          {formApi.errors.destination ? (
            <p className="text-xs text-rose-600">{formApi.errors.destination}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Frete (R$)</label>
          <Input
            value={formApi.form.price}
            onChange={(event) => formApi.patch("price", event.target.value)}
            placeholder="0,00"
          />
          {formApi.errors.price ? (
            <p className="text-xs text-rose-600">{formApi.errors.price}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <Select value={formApi.form.status} onValueChange={(value) => formApi.patch("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em_aberto">Em aberto</SelectItem>
              <SelectItem value="em_negociacao">Em negociação</SelectItem>
              <SelectItem value="fechada">Fechada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!formApi.canSubmit || submitting}>
          {submitting ? "Salvando..." : initialLoad ? "Salvar alterações" : "Criar carga"}
        </Button>
      </div>
    </form>
  );
}
