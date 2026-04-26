"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CadastroSearchItem } from "@/types";

interface SearchPanelProps {
  title: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  results: CadastroSearchItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

function statusLabel(status: CadastroSearchItem["status"]) {
  if (status === "ativo") return "Ativo";
  if (status === "inativo") return "Inativo";
  return "Pendente";
}

export function SearchPanel({
  title,
  placeholder,
  query,
  onQueryChange,
  onSearch,
  results,
  selectedId,
  onSelect,
  loading,
}: SearchPanelProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h2>
      <div className="flex gap-2">
        <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
        <Button type="button" onClick={onSearch} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </div>
      <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
        {results.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                <Badge variant={item.status === "ativo" ? "success" : "secondary"}>{statusLabel(item.status)}</Badge>
              </div>
              <p className="text-xs text-slate-500">{item.chave}</p>
              {item.subtitulo ? <p className="text-xs text-slate-500">{item.subtitulo}</p> : null}
            </button>
          );
        })}
        {results.length === 0 ? <p className="text-sm text-slate-500">Nenhum resultado encontrado.</p> : null}
      </div>
    </section>
  );
}
