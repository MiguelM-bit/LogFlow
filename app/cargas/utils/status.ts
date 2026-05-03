import {
  Ban,
  CheckCircle2,
  Circle,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";
import type { LoadStatus } from "@/app/cargas/types/contracts";

interface LoadStatusMeta {
  label: string;
  icon: LucideIcon;
  badgeVariant: BadgeProps["variant"];
}

const STATUS_META: Record<LoadStatus, LoadStatusMeta> = {
  em_aberto: {
    label: "Em aberto",
    icon: Circle,
    badgeVariant: "secondary",
  },
  em_negociacao: {
    label: "Em negociação",
    icon: Handshake,
    badgeVariant: "warning",
  },
  fechada: {
    label: "Fechada",
    icon: CheckCircle2,
    badgeVariant: "success",
  },
  cancelada: {
    label: "Cancelada",
    icon: Ban,
    badgeVariant: "danger",
  },
};

export function getLoadStatusMeta(status: LoadStatus): LoadStatusMeta {
  return STATUS_META[status];
}

export const loadStatusOrder: LoadStatus[] = [
  "em_aberto",
  "em_negociacao",
  "fechada",
  "cancelada",
];
