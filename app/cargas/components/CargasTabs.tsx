"use client";

import type { LoadStatus } from "@/app/cargas/types/contracts";
import { getLoadStatusMeta, loadStatusOrder } from "@/app/cargas/utils/status";

interface CargasTabsProps {
  active: LoadStatus;
  counts: Record<LoadStatus, number>;
  onChange: (status: LoadStatus) => void;
}

export function CargasTabs({ active, counts, onChange }: CargasTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {loadStatusOrder.map((status) => {
        const meta = getLoadStatusMeta(status);
        const Icon = meta.icon;
        const isActive = active === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{meta.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isActive ? "bg-white/20" : "bg-slate-100"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
