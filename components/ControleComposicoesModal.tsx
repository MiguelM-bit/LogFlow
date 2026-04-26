"use client";

import { useEffect, useMemo, useState } from "react";
import { Composicao, Motorista, Veiculo } from "@/types";
import { deactivateComposicao, updateComposicao } from "@/services/composicoes";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ControleComposicoesModalProps {
  composicoesAtivas: Composicao[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  onUpdated: () => Promise<void>;
}

interface EditState {
  motorista_id: string;
  cavalo_id: string;
  carreta_id: string;
}

function buildInitialEditState(composicoes: Composicao[]) {
  const entries = composicoes.map((item) => [
    item.id,
    {
      motorista_id: item.motorista_id,
      cavalo_id: item.cavalo_id,
      carreta_id: item.carreta_id,
    },
  ] as const);

  return Object.fromEntries(entries) as Record<string, EditState>;
}

export function ControleComposicoesModal({
  composicoesAtivas,
  motoristas,
  veiculos,
  onUpdated,
}: ControleComposicoesModalProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, EditState>>(() =>
    buildInitialEditState(composicoesAtivas)
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sortedComposicoes = useMemo(
    () => [...composicoesAtivas].sort((a, b) => a.id.localeCompare(b.id)),
    [composicoesAtivas]
  );

  useEffect(() => {
    setEditState(buildInitialEditState(composicoesAtivas));
  }, [composicoesAtivas]);

  const resetState = () => {
    setEditingId(null);
    setError(null);
    setFeedback(null);
    setEditState(buildInitialEditState(composicoesAtivas));
  };

  const lockedByOthers = (targetId: string) => {
    const others = composicoesAtivas.filter((item) => item.id !== targetId);

    return {
      motoristaIds: new Set(others.map((item) => item.motorista_id)),
      cavaloIds: new Set(others.map((item) => item.cavalo_id)),
      carretaIds: new Set(others.map((item) => item.carreta_id)),
    };
  };

  const getMotoristasDisponiveis = (targetId: string) => {
    const locks = lockedByOthers(targetId);

    return motoristas.filter((item) => item.status === "ativo" && !locks.motoristaIds.has(item.id));
  };

  const getCavalosDisponiveis = (targetId: string) => {
    const locks = lockedByOthers(targetId);

    return veiculos.filter((item) => item.categoria === "Trator" && !locks.cavaloIds.has(item.id));
  };

  const getCarretasDisponiveis = (targetId: string) => {
    const locks = lockedByOthers(targetId);

    return veiculos.filter((item) => item.categoria === "Reboque" && !locks.carretaIds.has(item.id));
  };

  const handleSave = async (composicaoId: string) => {
    const current = editState[composicaoId];

    if (!current?.motorista_id || !current?.cavalo_id || !current?.carreta_id) {
      setError("Selecione motorista, cavalo e carreta.");
      return;
    }

    setSavingId(composicaoId);
    setError(null);

    const result = await updateComposicao(supabase, {
      id: composicaoId,
      motorista_id: current.motorista_id,
      cavalo_id: current.cavalo_id,
      carreta_id: current.carreta_id,
    });

    setSavingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    await onUpdated();
    setEditingId(null);
    setFeedback("Composicao atualizada com sucesso.");
  };

  const handleRemove = async (composicaoId: string) => {
    setRemovingId(composicaoId);
    setError(null);

    const result = await deactivateComposicao(supabase, { id: composicaoId });

    setRemovingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    await onUpdated();
    setFeedback("Composicao removida com sucesso.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Controle de composicoes</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Controle de composicoes</DialogTitle>
          <DialogDescription>
            Janela de operacao para editar motorista, trocar carreta/cavalo e remover composicoes inativas.
          </DialogDescription>
        </DialogHeader>

        {feedback && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {feedback}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Cavalo</TableHead>
                <TableHead>Carreta</TableHead>
                <TableHead className="w-[280px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedComposicoes.map((item) => {
                const isEditing = editingId === item.id;
                const rowState = editState[item.id] ?? {
                  motorista_id: item.motorista_id,
                  cavalo_id: item.cavalo_id,
                  carreta_id: item.carreta_id,
                };

                const motoristasDisponiveis = getMotoristasDisponiveis(item.id);
                const cavalosDisponiveis = getCavalosDisponiveis(item.id);
                const carretasDisponiveis = getCarretasDisponiveis(item.id);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={rowState.motorista_id}
                          onValueChange={(value) =>
                            setEditState((prev) => ({
                              ...prev,
                              [item.id]: { ...rowState, motorista_id: value },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {motoristasDisponiveis.map((motorista) => (
                              <SelectItem key={motorista.id} value={motorista.id}>
                                {motorista.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.motorista?.nome ?? "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={rowState.cavalo_id}
                          onValueChange={(value) =>
                            setEditState((prev) => ({
                              ...prev,
                              [item.id]: { ...rowState, cavalo_id: value },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cavalosDisponiveis.map((veiculo) => (
                              <SelectItem key={veiculo.id} value={veiculo.id}>
                                {veiculo.placa} - {veiculo.tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.cavalo?.placa ?? "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={rowState.carreta_id}
                          onValueChange={(value) =>
                            setEditState((prev) => ({
                              ...prev,
                              [item.id]: { ...rowState, carreta_id: value },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {carretasDisponiveis.map((veiculo) => (
                              <SelectItem key={veiculo.id} value={veiculo.id}>
                                {veiculo.placa} - {veiculo.tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.carreta?.placa ?? "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void handleSave(item.id)}
                              disabled={savingId === item.id}
                            >
                              {savingId === item.id ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingId(item.id);
                                setError(null);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleRemove(item.id)}
                                disabled={removingId === item.id}
                            >
                              {removingId === item.id ? "Removendo..." : "Remover"}
                            </Button>

                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {sortedComposicoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                    Nenhuma composicao ativa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
