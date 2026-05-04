"use client";

import { Clock } from "lucide-react";
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

function formatDateTime(value: string | null) {
  if (!value) return "—";
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
            <TableHead>Cliente</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Data/hora Coleta</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Data/hora Descarga</TableHead>
            <TableHead className="w-[220px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id}>
              <TableCell>
                <LoadStatusBadge status={load.status} />
              </TableCell>
              <TableCell className="font-medium">{load.cliente ?? "—"}</TableCell>
              <TableCell className="text-slate-600">{load.perfil ?? "—"}</TableCell>
              <TableCell>{load.origin}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {formatDateTime(load.horarioColeta)}
              </TableCell>
              <TableCell>{load.destination}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {formatDateTime(load.horarioDescarga)}
              </TableCell>
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

                  <div className="group relative flex items-center">
                    <Clock className="h-3.5 w-3.5 cursor-default text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Atualizada em: {formatDateTime(load.updatedAt)}
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
