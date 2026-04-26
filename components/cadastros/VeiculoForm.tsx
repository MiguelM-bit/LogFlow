"use client";

import type { Empresa, VeiculoCadastro } from "@/types";
import { Field } from "@/components/cadastros/shared/Field";
import { Section } from "@/components/cadastros/shared/Section";
import { TabGroup } from "@/components/cadastros/shared/TabGroup";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

interface VeiculoFormProps {
  value: VeiculoCadastro;
  readOnly: boolean;
  onChange: (next: VeiculoCadastro) => void;
  empresas: Array<Pick<Empresa, "id" | "cnpj" | "razao_social" | "modalidade">>;
}

const tabs = [
  { id: "geral", label: "Geral" },
  { id: "composicao", label: "Composicao" },
  { id: "modalidade", label: "Modalidade" },
  { id: "proprietario", label: "Proprietario" },
];

const statusOptions = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
  { label: "Pendente", value: "pendente" },
];

export function VeiculoForm({ value, readOnly, onChange, empresas }: VeiculoFormProps) {
  const [activeTab, setActiveTab] = useState("geral");

  const missingOwnerCompany =
    value.modalidade?.toLowerCase() === "proprietario" && !value.proprietario_empresa_id;

  const empresaOptions = useMemo(
    () => [
      { label: "Selecione", value: "" },
      ...empresas.map((empresa) => ({
        value: empresa.id,
        label: `${empresa.razao_social} (${empresa.cnpj})`,
      })),
    ],
    [empresas]
  );

  const patch = (field: keyof VeiculoCadastro, next: string) => {
    onChange({ ...value, [field]: next || null });
  };

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[color:var(--color-foreground)]">Veiculo</h2>
          <Badge variant={value.status === "ativo" ? "success" : "secondary"}>{value.status}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <Field label="Placa" value={value.placa} onChange={(next) => onChange({ ...value, placa: next.toUpperCase() })} readOnly={readOnly} required className="xl:col-span-4" />
          <Field label="Status" value={value.status} onChange={(next) => onChange({ ...value, status: next as VeiculoCadastro["status"] })} readOnly={readOnly} options={statusOptions} className="xl:col-span-2" />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <TabGroup
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
          invalidTabs={missingOwnerCompany ? ["proprietario"] : []}
        />

        {activeTab === "geral" ? (
          <Section title="Dados gerais">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <Field label="Renavam" value={value.renavam} onChange={(next) => patch("renavam", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Chassis" value={value.chassis} onChange={(next) => patch("chassis", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Ano" type="number" value={value.ano} onChange={(next) => onChange({ ...value, ano: next ? Number(next) : null })} readOnly={readOnly} className="xl:col-span-2" />
              <Field label="Cor" value={value.cor} onChange={(next) => patch("cor", next)} readOnly={readOnly} className="xl:col-span-2" />
              <Field label="Municipio" value={value.municipio} onChange={(next) => patch("municipio", next)} readOnly={readOnly} className="xl:col-span-4" />
              <Field label="Marca" value={value.marca} onChange={(next) => patch("marca", next)} readOnly={readOnly} className="xl:col-span-4" />
              <Field label="Modelo" value={value.modelo} onChange={(next) => patch("modelo", next)} readOnly={readOnly} className="xl:col-span-4" />
            </div>
          </Section>
        ) : null}

        {activeTab === "composicao" ? (
          <Section title="Composicao">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <Field label="Agrupamento" value={value.agrupamento} onChange={(next) => patch("agrupamento", next)} readOnly={readOnly} className="xl:col-span-4" />
              <Field label="Classificacao" value={value.classificacao} onChange={(next) => patch("classificacao", next)} readOnly={readOnly} className="xl:col-span-4" />
            </div>
          </Section>
        ) : null}

        {activeTab === "modalidade" ? (
          <Section title="Modalidade">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <Field label="Modalidade" value={value.modalidade} onChange={(next) => patch("modalidade", next)} readOnly={readOnly} className="xl:col-span-4" />
              <Field label="Situacao" value={value.situacao} onChange={(next) => patch("situacao", next)} readOnly={readOnly} className="xl:col-span-4" />
            </div>
          </Section>
        ) : null}

        {activeTab === "proprietario" ? (
          <div className="space-y-4">
            <Section title="Proprietario">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field
                  label="Empresa proprietaria"
                  value={value.proprietario_empresa_id}
                  onChange={(next) => onChange({ ...value, proprietario_empresa_id: next || null })}
                  readOnly={readOnly}
                  options={empresaOptions}
                  className="xl:col-span-7"
                />
                <Field
                  label="CNPJ documento"
                  value={value.proprietario_cnpj_documento}
                  onChange={(next) => patch("proprietario_cnpj_documento", next)}
                  readOnly={readOnly}
                  className="xl:col-span-5"
                />
              </div>
            </Section>

            {missingOwnerCompany ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                A modalidade proprietario exige uma empresa vinculada no campo de proprietario.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
