"use client";

import type { LoadRecord, LoadStatus } from "@/app/cargas/types/contracts";
import { LoadStatusBadge } from "@/app/cargas/components/LoadStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CargasTableProps {
  loads: LoadRecord[];
  loadingStatusId: string | null;
  updatingId: string | null;
  onEdit: (load: LoadRecord) => void;
  onStatusChange: (load: LoadRecord, status: LoadStatus) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CargasTable({
  loads,
  loadingStatusId,
  updatingId,
  onEdit,
  onStatusChange,
}: CargasTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Frete</TableHead>
            <TableHead>Atualizada em</TableHead>
            <TableHead className="w-[220px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id}>
              <TableCell>
                <LoadStatusBadge status={load.status} />
              </TableCell>
              <TableCell className="font-medium">{load.origin}</TableCell>
              <TableCell>{load.destination}</TableCell>
              <TableCell>{formatCurrency(load.price)}</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDate(load.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    value={load.status}
                    onValueChange={(value) => onStatusChange(load, value as LoadStatus)}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_aberto">Em aberto</SelectItem>
                      <SelectItem value="em_negociacao">Em negociação</SelectItem>
                      <SelectItem value="fechada">Fechada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingStatusId === load.id || updatingId === load.id}
                    onClick={() => onEdit(load)}
                  >
                    Editar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
