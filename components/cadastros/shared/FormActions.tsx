"use client";

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  readOnly: boolean;
  hasSelection: boolean;
  saving: boolean;
  saveTone?: "default" | "warning" | "danger";
  feedbackMessage?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function FormActions({
  readOnly,
  hasSelection,
  saving,
  saveTone = "default",
  feedbackMessage,
  onEdit,
  onCancel,
  onSave,
}: FormActionsProps) {
  const saveToneClass =
    saveTone === "danger"
      ? "bg-rose-700 text-white hover:bg-rose-600"
      : saveTone === "warning"
        ? "bg-amber-600 text-white hover:bg-amber-500"
        : "bg-slate-800 text-white hover:bg-slate-700";

  if (readOnly && hasSelection) {
    return (
      <div className="flex justify-end border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-4 py-3">
        <Button type="button" onClick={onEdit} className="bg-slate-800 text-white hover:bg-slate-700">
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-4 py-3">
      {feedbackMessage ? (
        <span className="mr-auto rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 animate-fadeIn">
          {feedbackMessage}
        </span>
      ) : null}
      <Button type="button" variant="outline" onClick={onCancel} className="border-slate-400 bg-slate-200 text-slate-800 hover:bg-slate-300">
        Cancelar
      </Button>
      <Button type="button" onClick={onSave} disabled={saving} className={saveToneClass}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
