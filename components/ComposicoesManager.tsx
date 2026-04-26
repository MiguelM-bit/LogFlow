"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ComposicaoFull,
  HistoricoComposicao,
  Motorista,
  Veiculo,
} from "@/types";
import {
  createComposicao,
  deactivateComposicao,
  desengateComposicao,
  engateComposicao,
  listComposicoes,
  listHistoricoComposicao,
  trocarMotoristaComposicao,
  trocarVeiculoComposicao,
} from "@/services/composicoes";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { TrailerIcon, TractorIcon } from "@/components/VehicleIcons";
import { Search, Truck as TruckIcon, User } from "lucide-react";

interface ComposicoesManagerProps {
  initialComposicoes: ComposicaoFull[];
  initialMotoristas: Motorista[];
  initialVeiculos: Veiculo[];
}

function statusBadge(comp: ComposicaoFull, cargasAtivas: Set<string>) {
  if (!comp.ativo) return { label: "Inativa", cls: "bg-slate-100 text-slate-600 border-slate-300" };
  if (cargasAtivas.has(comp.id)) return { label: "Em uso", cls: "bg-blue-100 text-blue-700 border-blue-300" };
  return { label: "Ativa", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const eventoLabel: Record<HistoricoComposicao["evento"], string> = {
  engate: "Engate",
  desengate: "Desengate",
  troca_motorista: "Troca de motorista",
  troca_veiculo: "Troca de veículo",
};

// ─── Create Panel ────────────────────────────────────────────────────────────
function ComposicaoBuilderPanel({
  motoristas,
  veiculos,
  composicoesAtivas,
  onCreated,
}: {
  motoristas: Motorista[];
  veiculos: Veiculo[];
  composicoesAtivas: ComposicaoFull[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    motorista_id: "",
    cavalo_id: "",
    carreta_id: "",
    data_engate: "",
    local_engate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockedMotoristaIds = useMemo(
    () => new Set(composicoesAtivas.filter((item) => item.ativo).map((item) => item.motorista_id)),
    [composicoesAtivas]
  );
  const lockedCavalos = useMemo(
    () => new Set(composicoesAtivas.filter((item) => item.ativo).map((item) => item.cavalo_id)),
    [composicoesAtivas]
  );
  const lockedCarretas = useMemo(
    () => new Set(composicoesAtivas.filter((item) => item.ativo).map((item) => item.carreta_id)),
    [composicoesAtivas]
  );

  const motoristasLivres = useMemo(
    () => motoristas.filter((item) => item.status === "ativo" && !lockedMotoristaIds.has(item.id)),
    [motoristas, lockedMotoristaIds]
  );
  const cavalosLivres = useMemo(
    () => veiculos.filter((item) => item.categoria === "Trator" && !lockedCavalos.has(item.id)),
    [veiculos, lockedCavalos]
  );
  const carretasLivres = useMemo(
    () => veiculos.filter((item) => item.categoria === "Reboque" && !lockedCarretas.has(item.id)),
    [veiculos, lockedCarretas]
  );

  const selectedMotorista = motoristas.find((item) => item.id === form.motorista_id);
  const selectedCavalo = veiculos.find((item) => item.id === form.cavalo_id);
  const selectedCarreta = veiculos.find((item) => item.id === form.carreta_id);
  const canSubmit = Boolean(form.motorista_id && form.cavalo_id && form.carreta_id);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Selecione motorista, cavalo e carreta.");
      return;
    }
    setLoading(true);
    const result = await createComposicao(supabase, {
      motorista_id: form.motorista_id,
      cavalo_id: form.cavalo_id,
      carreta_id: form.carreta_id,
      data_engate: form.data_engate || undefined,
      local_engate: form.local_engate || undefined,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setForm({ motorista_id: "", cavalo_id: "", carreta_id: "", data_engate: "", local_engate: "" });
    setError(null);
    onCreated();
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <h3 className="text-base font-bold text-slate-900">Nova composicao</h3>
        <p className="text-sm text-slate-600">
          Monte motorista, cavalo e carreta no mesmo fluxo visual da operacao.
        </p>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-semibold text-slate-700">Operacao</h4>
            <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Frota</div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <User className="h-3.5 w-3.5" /> Motorista responsavel
            </label>
            <Select value={form.motorista_id} onValueChange={(v) => setForm((p) => ({ ...p, motorista_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione um motorista" /></SelectTrigger>
              <SelectContent>
                {motoristasLivres.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <TruckIcon className="h-3.5 w-3.5" /> Cavalo (trator)
            </label>
            <Select value={form.cavalo_id} onValueChange={(v) => setForm((p) => ({ ...p, cavalo_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione um cavalo" /></SelectTrigger>
              <SelectContent>
                {cavalosLivres.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.placa} — {v.tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <TruckIcon className="h-3.5 w-3.5" /> Carreta (reboque)
            </label>
            <Select value={form.carreta_id} onValueChange={(v) => setForm((p) => ({ ...p, carreta_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione uma carreta" /></SelectTrigger>
              <SelectContent>
                {carretasLivres.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.placa} — {v.tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Data engate</label>
              <Input
                type="datetime-local"
                value={form.data_engate}
                onChange={(e) => setForm((p) => ({ ...p, data_engate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Local engate</label>
              <Input
                placeholder="Ex: Pátio Campinas"
                value={form.local_engate}
                onChange={(e) => setForm((p) => ({ ...p, local_engate: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <Button className="w-full" onClick={() => void handleSubmit()} disabled={!canSubmit || loading}>
            {loading ? "Criando..." : "Criar composição"}
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-sm font-semibold text-slate-700">Preview da composicao</h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              <Search className="h-3 w-3" /> Acompanhe os dados selecionados
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motorista</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedMotorista?.nome ?? "Aguardando selecao"}</p>
              <p className="text-xs text-slate-500">{selectedMotorista?.telefone ?? "Sem telefone"}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cavalo</p>
              <div className="mt-2 flex items-center gap-2">
                <TractorIcon className="h-6 w-10 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedCavalo?.placa ?? "Sem cavalo"}</p>
                  <p className="text-xs text-slate-500">{selectedCavalo?.tipo ?? ""}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Carreta</p>
              <div className="mt-2 flex items-center gap-2">
                <TrailerIcon className="h-6 w-10 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedCarreta?.placa ?? "Sem carreta"}</p>
                  <p className="text-xs text-slate-500">{selectedCarreta?.tipo ?? ""}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            {canSubmit
              ? "Composicao pronta para criacao. Revise os dados e confirme para salvar."
              : "Selecione motorista, cavalo e carreta para habilitar o cadastro da composicao."}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Detalhe / Edição Modal ───────────────────────────────────────────────────
function ComposicaoDetailModal({
  comp,
  motoristas,
  veiculos,
  onUpdated,
}: {
  comp: ComposicaoFull;
  motoristas: Motorista[];
  veiculos: Veiculo[];
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoComposicao[]>([]);
  const [engateForm, setEngateForm] = useState({ data: "", local: "" });
  const [desengateForm, setDesengateForm] = useState({ data: "", local: "" });
  const [novoMotorista, setNovoMotorista] = useState(comp.motorista_id);
  const [novoCavalo, setNovoCavalo] = useState(comp.cavalo_id);
  const [novaCarreta, setNovaCarreta] = useState(comp.carreta_id);

  const cavalos = veiculos.filter((v) => v.categoria === "Trator");
  const carretas = veiculos.filter((v) => v.categoria === "Reboque");

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const loadHistorico = useCallback(async () => {
    const result = await listHistoricoComposicao(supabase, comp.id);
    setHistorico(result.data);
  }, [comp.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) void loadHistorico();
  }, [open, loadHistorico]);

  const act = async (fn: () => Promise<{ data: boolean; error: string | null }>, successMsg: string) => {
    setLoading(true);
    setError(null);
    const result = await fn();
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    showFeedback(successMsg);
    onUpdated();
    await loadHistorico();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Gerenciar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Composição #{comp.id.slice(0, 8)} —{" "}
            <span className="text-slate-500">{comp.motorista?.nome ?? "Sem motorista"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {feedback && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {feedback}
            </p>
          )}
          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
              {error.includes("/programacao") && (
                <a href="/programacao" className="ml-2 underline font-medium">Ir para Programação →</a>
              )}
              {error.includes("/composicoes") && (
                <a href="/composicoes" className="ml-2 underline font-medium">Ir para Composições →</a>
              )}
            </p>
          )}

          {/* Engate */}
          <section className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Engate</h3>
            <p className="mb-2 text-xs text-slate-500">
              Atual: {formatDate(comp.data_engate)} {comp.local_engate ? `— ${comp.local_engate}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={engateForm.data}
                onChange={(e) => setEngateForm((p) => ({ ...p, data: e.target.value }))}
              />
              <Input
                placeholder="Local do engate"
                value={engateForm.local}
                onChange={(e) => setEngateForm((p) => ({ ...p, local: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              className="mt-2"
              disabled={loading || !engateForm.data || !engateForm.local}
              onClick={() =>
                void act(
                  () => engateComposicao(supabase, { id: comp.id, data_engate: engateForm.data, local_engate: engateForm.local }),
                  "Engate registrado."
                )
              }
            >
              Registrar engate
            </Button>
          </section>

          {/* Desengate */}
          <section className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Desengate</h3>
            <p className="mb-2 text-xs text-slate-500">
              Atual: {formatDate(comp.data_desengate)} {comp.local_desengate ? `— ${comp.local_desengate}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={desengateForm.data}
                onChange={(e) => setDesengateForm((p) => ({ ...p, data: e.target.value }))}
              />
              <Input
                placeholder="Local do desengate"
                value={desengateForm.local}
                onChange={(e) => setDesengateForm((p) => ({ ...p, local: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={loading || !desengateForm.data || !desengateForm.local}
              onClick={() =>
                void act(
                  () => desengateComposicao(supabase, { id: comp.id, data_desengate: desengateForm.data, local_desengate: desengateForm.local }),
                  "Desengate registrado. Composição desativada."
                )
              }
            >
              Registrar desengate
            </Button>
          </section>

          {/* Trocar motorista */}
          <section className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Trocar motorista</h3>
            <div className="flex gap-2">
              <Select value={novoMotorista} onValueChange={setNovoMotorista}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {motoristas.filter((m) => m.status === "ativo").map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={loading || novoMotorista === comp.motorista_id}
                onClick={() =>
                  void act(
                    () => trocarMotoristaComposicao(supabase, { id: comp.id, motorista_id: novoMotorista }),
                    "Motorista atualizado."
                  )
                }
              >
                Atualizar
              </Button>
            </div>
          </section>

          {/* Trocar cavalo */}
          <section className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Trocar cavalo (trator)</h3>
            <div className="flex gap-2">
              <Select value={novoCavalo} onValueChange={setNovoCavalo}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cavalos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.placa} — {v.tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={loading || novoCavalo === comp.cavalo_id}
                onClick={() =>
                  void act(
                    () => trocarVeiculoComposicao(supabase, { id: comp.id, tipo: "cavalo", veiculo_id: novoCavalo }),
                    "Cavalo atualizado."
                  )
                }
              >
                Atualizar
              </Button>
            </div>
          </section>

          {/* Trocar carreta */}
          <section className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Trocar carreta (reboque)</h3>
            <div className="flex gap-2">
              <Select value={novaCarreta} onValueChange={setNovaCarreta}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {carretas.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.placa} — {v.tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={loading || novaCarreta === comp.carreta_id}
                onClick={() =>
                  void act(
                    () => trocarVeiculoComposicao(supabase, { id: comp.id, tipo: "carreta", veiculo_id: novaCarreta }),
                    "Carreta atualizada."
                  )
                }
              >
                Atualizar
              </Button>
            </div>
          </section>

          {/* Histórico */}
          {historico.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Histórico</h3>
              <div className="space-y-1">
                {historico.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs">
                    <span className="font-medium text-slate-700">{eventoLabel[h.evento]}</span>
                    {h.local && <span className="text-slate-500">{h.local}</span>}
                    <span className="text-slate-400">{formatDate(h.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Desativar */}
          <section className="border-t border-slate-200 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              disabled={loading}
              onClick={() =>
                void act(
                  () => deactivateComposicao(supabase, { id: comp.id }),
                  "Composição desativada."
                )
              }
            >
              Desativar composição
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ComposicoesManager({
  initialComposicoes,
  initialMotoristas,
  initialVeiculos,
}: ComposicoesManagerProps) {
  const [composicoes, setComposicoes] = useState<ComposicaoFull[]>(initialComposicoes);
  const [motoristas] = useState(initialMotoristas);
  const [veiculos] = useState(initialVeiculos);
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativa" | "inativa" | "em_uso">("todos");
  const [cargasAtivas, setCargasAtivas] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const result = await listComposicoes(supabase);
    setComposicoes(result.data as ComposicaoFull[]);

    // carregar composicoes em uso
    const { data } = await supabase
      .from("cargas")
      .select("composicao_id")
      .not("composicao_id", "is", null)
      .or("status.is.null,status.neq.concluida");
    const ids = new Set((data ?? []).map((r: { composicao_id: string }) => r.composicao_id));
    setCargasAtivas(ids);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const ch = supabase
      .channel("composicoes-manager")
      .on("postgres_changes", { event: "*", schema: "public", table: "composicoes" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargas" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [refresh]);

  const filtered = composicoes.filter((c) => {
    if (filtroAtivo === "ativa") return c.ativo && !cargasAtivas.has(c.id);
    if (filtroAtivo === "inativa") return !c.ativo;
    if (filtroAtivo === "em_uso") return cargasAtivas.has(c.id);
    return true;
  });

  const tabs = [
    { key: "todos", label: `Todos (${composicoes.length})` },
    { key: "ativa", label: `Ativos (${composicoes.filter((c) => c.ativo && !cargasAtivas.has(c.id)).length})` },
    { key: "em_uso", label: `Em uso (${cargasAtivas.size})` },
    { key: "inativa", label: `Inativos (${composicoes.filter((c) => !c.ativo).length})` },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFiltroAtivo(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filtroAtivo === t.key
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ComposicaoBuilderPanel
        motoristas={motoristas}
        veiculos={veiculos}
        composicoesAtivas={composicoes}
        onCreated={refresh}
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Cavalo</TableHead>
              <TableHead>Carreta</TableHead>
              <TableHead>Engate</TableHead>
              <TableHead>Local engate</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((comp) => {
              const badge = statusBadge(comp, cargasAtivas);
              return (
                <TableRow key={comp.id}>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{comp.motorista?.nome ?? "—"}</TableCell>
                  <TableCell>{comp.cavalo?.placa ?? "—"}</TableCell>
                  <TableCell>{comp.carreta?.placa ?? "—"}</TableCell>
                  <TableCell className="text-xs text-slate-500">{formatDate(comp.data_engate)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{comp.local_engate ?? "—"}</TableCell>
                  <TableCell>
                    <ComposicaoDetailModal
                      comp={comp}
                      motoristas={motoristas}
                      veiculos={veiculos}
                      onUpdated={refresh}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-slate-500">
                  Nenhuma composição encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
