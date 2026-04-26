"use client";

import { JanelaHorarioFiltro, ProgramacaoFiltrosComSLA, SLAPrioridade } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface FiltrosProgramacaoProps {
  filtros: ProgramacaoFiltrosComSLA;
  onChange: (next: ProgramacaoFiltrosComSLA) => void;
  clientes: string[];
}

const janelaLabels: Record<JanelaHorarioFiltro, string> = {
  "2h": "Proximas 2h",
  "4h": "Proximas 4h",
  hoje: "Hoje",
  todos: "Todos",
};

const prioridadeLabels: Record<SLAPrioridade | "todos", string> = {
  critico: "Crítico",
  alerta: "Alerta",
  ok: "OK",
  todos: "Todas prioridades",
};

export function FiltrosProgramacao({ filtros, onChange, clientes }: FiltrosProgramacaoProps) {
  return (
    <Card className="space-y-3 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({ ...filtros, somenteCriticos: !filtros.somenteCriticos, prioridade: "todos" })
          }
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
            filtros.somenteCriticos
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              filtros.somenteCriticos ? "bg-red-500" : "bg-slate-300"
            }`}
          />
          Somente críticos
        </button>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all duration-200 ease-out hover:bg-slate-50">
          <input
            type="checkbox"
            checked={filtros.semMotorista}
            onChange={(e) => onChange({ ...filtros, semMotorista: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Sem motorista
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <Select
          value={filtros.prioridade}
          onValueChange={(value) =>
            onChange({ ...filtros, prioridade: value as SLAPrioridade | "todos", somenteCriticos: false })
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {(["todos", "critico", "alerta", "ok"] as const).map((v) => (
              <SelectItem key={v} value={v}>
                {prioridadeLabels[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.cliente}
          onValueChange={(value) => onChange({ ...filtros, cliente: value })}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.janelaHorario}
          onValueChange={(value: JanelaHorarioFiltro) =>
            onChange({ ...filtros, janelaHorario: value })
          }
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Janela de horario" />
          </SelectTrigger>
          <SelectContent>
            {(["todos", "2h", "4h", "hoje"] as JanelaHorarioFiltro[]).map((v) => (
              <SelectItem key={v} value={v}>
                {janelaLabels[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          placeholder="Buscar origem, destino..."
          className="bg-white"
        />
      </div>
    </Card>
  );
}
