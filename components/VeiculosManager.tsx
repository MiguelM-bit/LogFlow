"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CategoriaVeiculo, Veiculo } from "@/types";
import { createVeiculo, listVeiculos } from "@/services/veiculos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VeiculosManagerProps {
  initialData: Veiculo[];
}

interface FormState {
  placa: string;
  tipo: string;
  categoria: CategoriaVeiculo;
  proprietario_pj: string;
}

const INITIAL_STATE: FormState = {
  placa: "",
  tipo: "Cavalo",
  categoria: "Trator",
  proprietario_pj: "",
};

export function VeiculosManager({ initialData }: VeiculosManagerProps) {
  const [veiculos, setVeiculos] = useState(initialData);
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const result = await listVeiculos(supabase);
    setVeiculos(result.data);
    setError(result.error);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.placa.trim() || !form.tipo.trim() || !form.categoria) {
      setError("Preencha placa, tipo e categoria.");
      return;
    }

    setSaving(true);
    const result = await createVeiculo(supabase, {
      placa: form.placa.trim().toUpperCase(),
      tipo: form.tipo.trim(),
      categoria: form.categoria,
      proprietario_pj: form.proprietario_pj.trim() || null,
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
          value={form.placa}
          onChange={(event) => setForm((prev) => ({ ...prev, placa: event.target.value }))}
          placeholder="Placa"
        />
        <Input
          value={form.tipo}
          onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
          placeholder="Tipo (ex: Cavalo, Sider, Bau)"
        />
        <Select
          value={form.categoria}
          onValueChange={(value: CategoriaVeiculo) => setForm((prev) => ({ ...prev, categoria: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Trator">Trator</SelectItem>
            <SelectItem value="Reboque">Reboque</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={form.proprietario_pj}
          onChange={(event) => setForm((prev) => ({ ...prev, proprietario_pj: event.target.value }))}
          placeholder="Proprietario PJ (opcional)"
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Novo veiculo"}
        </Button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Proprietario PJ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {veiculos.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell className="font-medium">{item.placa}</TableCell>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.proprietario_pj ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
