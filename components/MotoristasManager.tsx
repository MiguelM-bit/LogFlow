"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Motorista, MotoristaStatus } from "@/types";
import { createMotorista, listMotoristas } from "@/services/motoristas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MotoristasManagerProps {
  initialData: Motorista[];
}

interface FormState {
  nome: string;
  cpf: string;
  telefone: string;
  status: MotoristaStatus;
}

const INITIAL_STATE: FormState = {
  nome: "",
  cpf: "",
  telefone: "",
  status: "ativo",
};

export function MotoristasManager({ initialData }: MotoristasManagerProps) {
  const [motoristas, setMotoristas] = useState(initialData);
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const result = await listMotoristas(supabase);
    setMotoristas(result.data);
    setError(result.error);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.cpf.trim()) {
      setError("Preencha nome e CPF.");
      return;
    }

    setSaving(true);
    const result = await createMotorista(supabase, {
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      telefone: form.telefone.trim() || null,
      status: form.status,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setForm(INITIAL_STATE);
    await refresh();
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-5">
        <Input
          value={form.nome}
          onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
          placeholder="Nome"
        />
        <Input
          value={form.cpf}
          onChange={(event) => setForm((prev) => ({ ...prev, cpf: event.target.value }))}
          placeholder="CPF"
        />
        <Input
          value={form.telefone}
          onChange={(event) => setForm((prev) => ({ ...prev, telefone: event.target.value }))}
          placeholder="Telefone (opcional)"
        />
        <Select
          value={form.status}
          onValueChange={(value: MotoristaStatus) => setForm((prev) => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Novo motorista"}
        </Button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motoristas.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>{item.cpf}</TableCell>
                <TableCell>{item.telefone ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "ativo" ? "success" : "secondary"}>
                    {item.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
