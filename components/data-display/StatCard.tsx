import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  hint?: string;
}

const toneStyles = {
  default: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
} as const;

export function StatCard({ label, value, icon: Icon, tone = "default", hint }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
