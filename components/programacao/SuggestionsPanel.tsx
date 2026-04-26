"use client";

import { Lightbulb, Users, PackageOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionSuggestion } from "@/services/schedulingService";

interface SuggestionsPanelProps {
  suggestions: ActionSuggestion[];
  onApplySuggestion: (suggestion: ActionSuggestion) => void;
}

const iconMap = {
  assign_driver: Users,
  group_loads: PackageOpen,
  urgent_alert: Lightbulb,
};

const colorMap = {
  assign_driver: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "bg-blue-500",
    text: "text-blue-700",
    btn: "border-blue-200 text-blue-700 hover:bg-blue-50",
  },
  group_loads: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "bg-emerald-500",
    text: "text-emerald-700",
    btn: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  },
  urgent_alert: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "bg-amber-500",
    text: "text-amber-700",
    btn: "border-amber-200 text-amber-700 hover:bg-amber-50",
  },
};

export function SuggestionsPanel({
  suggestions,
  onApplySuggestion,
}: SuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-700">
          Sugestões de otimização
        </h3>
        <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {suggestions.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((suggestion) => {
          const colors = colorMap[suggestion.type];
          const Icon = iconMap[suggestion.type];

          return (
            <div
              key={suggestion.id}
              className={`flex min-w-[260px] flex-col gap-3 rounded-2xl border ${colors.bg} ${colors.border} p-4 shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colors.icon}`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    {suggestion.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className={`mt-auto self-start text-xs ${colors.btn}`}
                onClick={() => onApplySuggestion(suggestion)}
              >
                Aplicar
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
