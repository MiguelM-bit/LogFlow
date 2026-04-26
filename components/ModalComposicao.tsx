"use client";

import { useMemo, useState } from "react";
import { Composicao, Motorista, Veiculo } from "@/types";
import { createComposicao } from "@/services/composicoes";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TractorIcon, TrailerIcon } from "./VehicleIcons";
import { MinusCircle, Truck as TruckIcon, User, Search } from "lucide-react";

interface ModalComposicaoProps {
  motoristas: Motorista[];
  veiculos: Veiculo[];
  composicoesAtivas: Composicao[];
  onCreated: () => Promise<void>;
}

interface FormState {
  motorista_id: string;
  cavalo_id: string;
  carreta_id: string;
}

const INITIAL_STATE: FormState = {
  motorista_id: "",
  cavalo_id: "",
  carreta_id: "",
};

export function ModalComposicao({ motoristas, veiculos, composicoesAtivas, onCreated }: ModalComposicaoProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compositionType] = useState<"cavalo-carreta" | "truck">("cavalo-carreta");

  const lockedMotoristaIds = useMemo(
    () => new Set(composicoesAtivas.map((item) => item.motorista_id)),
    [composicoesAtivas]
  );
  const lockedCavalos = useMemo(
    () => new Set(composicoesAtivas.map((item) => item.cavalo_id)),
    [composicoesAtivas]
  );
  const lockedCarretas = useMemo(
    () => new Set(composicoesAtivas.map((item) => item.carreta_id)),
    [composicoesAtivas]
  );

  const motoristasLivres = motoristas.filter(
    (item) => item.status === "ativo" && !lockedMotoristaIds.has(item.id)
  );
  const cavalosLivres = veiculos.filter(
    (item) => item.categoria === "Trator" && !lockedCavalos.has(item.id)
  );
  const carretasLivres = veiculos.filter(
    (item) => item.categoria === "Reboque" && !lockedCarretas.has(item.id)
  );

  const canSubmit = form.motorista_id && form.cavalo_id && (compositionType === "truck" || form.carreta_id);

  const resetForm = () => {
    setForm(INITIAL_STATE);
    setError(null);
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const result = await createComposicao(supabase, form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await onCreated();
    setOpen(false);
    resetForm();
  };

  const selectedMotorista = motoristas.find((m) => m.id === form.motorista_id);
  const selectedCavalo = veiculos.find((v) => v.id === form.cavalo_id);
  const selectedCarreta = veiculos.find((v) => v.id === form.carreta_id);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">Nova composicao</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Montagem da Composição</DialogTitle>
          <DialogDescription>
            Configure visualmente a composição, motorista e veículos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-auto bg-slate-50">
          {/* LEFT PANE - OPERATIONS */}
          <div className="w-1/3 border-r p-6 bg-white space-y-6 overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-semibold text-slate-700">Operação</h3>
              <div className="flex rounded-md bg-slate-100 p-1">
                <button className="px-3 py-1 text-xs font-medium bg-white shadow-sm rounded-sm">Frota</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700">Terceiro</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex align-center gap-1">
                  <User className="w-3 h-3" /> Motorista Responsável
                </label>
                <Select
                  value={form.motorista_id}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, motorista_id: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um motorista livre" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoristasLivres.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMotorista && (
                  <div className="mt-2 text-xs text-slate-500 p-2 bg-slate-50 border rounded-md">
                    <p><strong>CPF:</strong> {selectedMotorista.cpf}</p>
                    {selectedMotorista.telefone && <p><strong>Tel.:</strong> {selectedMotorista.telefone}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full flex gap-2">
                <Search className="w-4 h-4" /> Localizar Veículos Próximos
              </Button>
            </div>
            
            {error && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}
          </div>

          {/* RIGHT PANE - ASSEMBLY */}
          <div className="w-2/3 p-6 flex flex-col items-center bg-slate-50 space-y-8 overflow-y-auto">
            
            {/* Visual Assembly Area */}
            <div className="w-full max-w-lg bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center min-h-[160px]">
              <div className="flex items-center justify-center gap-1">
                {compositionType === "cavalo-carreta" ? (
                  <>
                    <div className={`w-32 transition-all ${selectedCarreta ? "opacity-100" : "opacity-30 grayscale"}`}>
                      <TrailerIcon color="#cbd5e1" />
                    </div>
                    <div className={`w-24 transition-all ${selectedCavalo ? "opacity-100" : "opacity-30 grayscale"}`}>
                      <TractorIcon color="#475569" />
                    </div>
                  </>
                ) : (
                  <div className="w-48 opacity-100 text-slate-600">
                     <TruckIcon className="w-32 h-32" />
                  </div>
                )}
              </div>
              <p className="mt-6 text-sm font-medium text-slate-500 uppercase tracking-widest">
                {compositionType === "cavalo-carreta" ? "Cavalo + Carreta" : "Caminhão Toco/Truck"}
              </p>
            </div>

            {/* Selection Cards */}
            <div className="w-full max-w-lg space-y-4">
              {/* Parte Dianteira / Cavalo */}
              <div className="bg-white border rounded-lg p-4 shadow-sm relative group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {compositionType === "cavalo-carreta" ? "Cavalo Mecânico" : "Caminhão"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedCavalo ? `${selectedCavalo.placa} • ${selectedCavalo.tipo}` : "Nenhum veículo selecionado"}
                    </p>
                  </div>
                  {selectedCavalo ? (
                    <Button variant="ghost" size="icon" onClick={() => setForm(p => ({...p, cavalo_id: ""}))} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-8 w-8">
                       <MinusCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                     <Select value={form.cavalo_id} onValueChange={(value) => setForm((prev) => ({ ...prev, cavalo_id: value }))}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Adicionar veículo" />
                        </SelectTrigger>
                        <SelectContent>
                            {cavalosLivres.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.placa} ({item.tipo})
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  )}
                </div>
              </div>

              {/* Parte Traseira / Carreta */}
              {compositionType === "cavalo-carreta" && (
                <div className="bg-white border rounded-lg p-4 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Carreta / Reboque</h4>
                      <p className="text-xs text-slate-500">
                        {selectedCarreta ? `${selectedCarreta.placa} • ${selectedCarreta.tipo}` : "Nenhum reboque selecionado"}
                      </p>
                    </div>
                    {selectedCarreta ? (
                      <Button variant="ghost" size="icon" onClick={() => setForm(p => ({...p, carreta_id: ""}))} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-8 w-8">
                         <MinusCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                       <Select value={form.carreta_id} onValueChange={(value) => setForm((prev) => ({ ...prev, carreta_id: value }))}>
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Adicionar carreta" />
                          </SelectTrigger>
                          <SelectContent>
                              {carretasLivres.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.placa} ({item.tipo})
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit || saving} className="min-w-[140px]">
            {saving ? "Salvando..." : "Confirmar Montagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
