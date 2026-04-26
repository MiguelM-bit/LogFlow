"use client";

import { Load, LoadStatus } from "@/types";
import { LoadCard } from "./LoadCard";

interface KanbanColumnProps {
  title: string;
  status: LoadStatus;
  loads: Load[];
  onDragOver?: (e: React.DragEvent, status: LoadStatus) => void;
  onDrop?: (e: React.DragEvent, status: LoadStatus) => void;
  onDragStart?: (loadId: string) => void;
  onMoveToNextStatus?: (load: Load) => void;
  updatingLoadIds?: Set<string>;
}

const statusConfig: Record<LoadStatus, { color: string; icon: string }> = {
  available: { color: "bg-blue-100", icon: "📦" },
  negotiating: { color: "bg-yellow-100", icon: "🤝" },
  scheduled: { color: "bg-purple-100", icon: "📅" },
  completed: { color: "bg-green-100", icon: "✅" },
};

export function KanbanColumn({
  title,
  status,
  loads,
  onDragOver,
  onDrop,
  onDragStart,
  onMoveToNextStatus,
  updatingLoadIds,
}: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <div
      className="flex-1 min-h-[600px] bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
      onDragOver={(e) => onDragOver?.(e, status)}
      onDrop={(e) => onDrop?.(e, status)}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{config.icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className={`${config.color} text-sm font-semibold px-2 py-1 rounded`}>
          {loads.length}
        </span>
      </div>

      {/* Load Cards */}
      <div className="space-y-3">
        {loads.length > 0 ? (
          loads.map((load) => (
            <LoadCard
              key={load.id}
              load={load}
              onDragStart={onDragStart}
              onMoveToNextStatus={onMoveToNextStatus}
              isUpdating={Boolean(updatingLoadIds?.has(load.id))}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400 text-sm font-medium">
              Nenhuma carga aqui
            </p>
            <p className="text-gray-300 text-xs">
              Arraste cargas ou adicione novas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
