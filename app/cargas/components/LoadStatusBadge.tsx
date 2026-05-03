import { Badge } from "@/components/ui/badge";
import type { LoadStatus } from "@/app/cargas/types/contracts";
import { getLoadStatusMeta } from "@/app/cargas/utils/status";

interface LoadStatusBadgeProps {
  status: LoadStatus;
}

export function LoadStatusBadge({ status }: LoadStatusBadgeProps) {
  const meta = getLoadStatusMeta(status);
  const Icon = meta.icon;

  return (
    <Badge variant={meta.badgeVariant} className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}
