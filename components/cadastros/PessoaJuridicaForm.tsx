"use client";

import type { Empresa } from "@/types";
import { AddressForm } from "@/components/forms/AddressForm";
import { Field } from "@/components/cadastros/shared/Field";
import { Section } from "@/components/cadastros/shared/Section";
import { TabGroup } from "@/components/cadastros/shared/TabGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCnpjSearch } from "@/hooks/useCnpjSearch";
import { formatCNPJ, normalizeDocument, validators } from "@/services/validators";
import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface PessoaJuridicaFormProps {
  value: Empresa;
  readOnly: boolean;
  onChange: (next: Empresa) => void;
}

const tabs = [
  { id: "identificacao", label: "Identificacao" },
  { id: "dados", label: "Dados" },
  { id: "outros", label: "Outros" },
];

const statusOptions = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
  { label: "Pendente", value: "pendente" },
];

export function PessoaJuridicaForm({ value, readOnly, onChange }: PessoaJuridicaFormProps) {
  const [activeTab, setActiveTab] = useState("identificacao");
  const [showCnpjLookupError, setShowCnpjLookupError] = useState(false);
  const [isSearchCooldown, setIsSearchCooldown] = useState(false);
  const errorTimeoutRef = useRef<number | null>(null);
  const cooldownTimeoutRef = useRef<number | null>(null);
  const cooldownActiveRef = useRef(false);
  const cnpjDigits = normalizeDocument(value.cnpj);
  const isCnpjComplete = cnpjDigits.length === 14;
  const isCnpjInvalid = isCnpjComplete && !validators.cnpj(cnpjDigits);
  const { buscarCnpj, loading: cnpjLoading, error: cnpjLookupError } = useCnpjSearch();

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }

      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const rntrc = useMemo(
    () =>
      value.rntrc ?? {
        numero: "",
        data_emissao: null,
        validade: null,
        tipo_transportador: "",
      },
    [value.rntrc]
  );

  const patch = (field: keyof Empresa, next: string) => {
    onChange({ ...value, [field]: next || null });
  };

  const patchRntrc = (field: keyof NonNullable<Empresa["rntrc"]>, next: string) => {
    onChange({
      ...value,
      rntrc: {
        ...rntrc,
        [field]: next || null,
      },
    });
  };

  const clearLookupErrorPulse = () => {
    if (errorTimeoutRef.current) {
      window.clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setShowCnpjLookupError(false);
  };

  const triggerLookupErrorPulse = () => {
    clearLookupErrorPulse();
    setShowCnpjLookupError(true);
    errorTimeoutRef.current = window.setTimeout(() => {
      setShowCnpjLookupError(false);
      errorTimeoutRef.current = null;
    }, 650);
  };

  const startSearchCooldown = () => {
    cooldownActiveRef.current = true;
    setIsSearchCooldown(true);

    if (cooldownTimeoutRef.current) {
      window.clearTimeout(cooldownTimeoutRef.current);
    }

    cooldownTimeoutRef.current = window.setTimeout(() => {
      cooldownActiveRef.current = false;
      setIsSearchCooldown(false);
      cooldownTimeoutRef.current = null;
    }, 700);
  };

  const handleSearchCnpj = async () => {
    if (cooldownActiveRef.current || cnpjLoading) {
      return;
    }

    startSearchCooldown();

    const result = await buscarCnpj(cnpjDigits);

    if (!result) {
      triggerLookupErrorPulse();
      return;
    }

    clearLookupErrorPulse();

    onChange({
      ...value,
      cnpj: formatCNPJ(result.cnpj),
      razao_social: result.razaoSocial || value.razao_social,
      nome_fantasia: result.nomeFantasia || value.nome_fantasia,
      cnae: result.cnae || value.cnae,
      atividade_fiscal: result.atividadeFiscal || value.atividade_fiscal,
      regime_tributario: result.regimeTributario || value.regime_tributario,
      email: result.email || value.email,
      telefone_numero: result.telefone || value.telefone_numero,
      endereco: {
        ...value.endereco,
        cep: result.endereco.cep || value.endereco.cep,
        logradouro: result.endereco.logradouro || value.endereco.logradouro,
        numero: result.endereco.numero || value.endereco.numero,
        complemento: result.endereco.complemento || value.endereco.complemento,
        bairro: result.endereco.bairro || value.endereco.bairro,
        municipio: result.endereco.municipio || value.endereco.municipio,
        uf: result.endereco.uf || value.endereco.uf,
      },
    });
  };

  const invalidTabs = useMemo(() => {
    const tabs: string[] = [];
    if (isCnpjInvalid || showCnpjLookupError) {
      tabs.push("identificacao");
    }
    return tabs;
  }, [isCnpjInvalid, showCnpjLookupError]);

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[color:var(--color-foreground)]">Pessoa Juridica</h2>
          <Badge variant={value.status === "ativo" ? "success" : "secondary"}>{value.status}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <label className={showCnpjLookupError || isCnpjInvalid ? "space-y-1.5 animate-cep-error-shake xl:col-span-3" : "space-y-1.5 xl:col-span-3"}>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600">CNPJ *</span>
            <div className="relative">
              <Input
                value={formatCNPJ(value.cnpj)}
                onChange={(event) => {
                  clearLookupErrorPulse();
                  onChange({ ...value, cnpj: formatCNPJ(event.target.value) });
                }}
                readOnly={readOnly}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={showCnpjLookupError || isCnpjInvalid ? "pr-11 border-red-500 focus-visible:ring-red-500 animate-cep-error-pulse" : "pr-11"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleSearchCnpj()}
                disabled={readOnly || cnpjLoading || isSearchCooldown || !isCnpjComplete}
                className="absolute right-0 top-0 h-9 w-9 text-slate-500 hover:text-slate-900"
                aria-label="Buscar CNPJ"
              >
                {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {isCnpjInvalid ? <p className="text-xs text-red-600">CNPJ inválido</p> : null}
            {!isCnpjInvalid && cnpjLookupError === "CNPJ não encontrado" ? <p className="text-xs text-red-600">CNPJ não encontrado</p> : null}
            {!isCnpjInvalid && cnpjLookupError && cnpjLookupError !== "CNPJ não encontrado" ? <p className="text-xs text-red-600">Erro ao buscar dados</p> : null}
          </label>
          <Field label="Razao social" value={value.razao_social} onChange={(next) => onChange({ ...value, razao_social: next })} readOnly={readOnly} required className="xl:col-span-7" />
          <Field label="Status" value={value.status} onChange={(next) => onChange({ ...value, status: next as Empresa["status"] })} readOnly={readOnly} options={statusOptions} className="xl:col-span-2" />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <TabGroup tabs={tabs} active={activeTab} onChange={setActiveTab} invalidTabs={invalidTabs} />

        {activeTab === "identificacao" ? (
          <div className="space-y-4">
            <Section title="Identificacao">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Nome fantasia" value={value.nome_fantasia} onChange={(next) => patch("nome_fantasia", next)} readOnly={readOnly} className="xl:col-span-4" />
                <Field label="CNAE" value={value.cnae} onChange={(next) => patch("cnae", next)} readOnly={readOnly} className="xl:col-span-2" />
                <Field label="Inscricao estadual" value={value.inscricao_estadual} onChange={(next) => patch("inscricao_estadual", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Atividade fiscal" value={value.atividade_fiscal} onChange={(next) => patch("atividade_fiscal", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Regime tributario" value={value.regime_tributario} onChange={(next) => patch("regime_tributario", next)} readOnly={readOnly} className="xl:col-span-4" />
              </div>
            </Section>

            <Section title="RNTRC">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Numero" value={rntrc.numero} onChange={(next) => patchRntrc("numero", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Data emissao" type="date" value={rntrc.data_emissao} onChange={(next) => patchRntrc("data_emissao", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Validade" type="date" value={rntrc.validade} onChange={(next) => patchRntrc("validade", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Tipo transportador" value={rntrc.tipo_transportador} onChange={(next) => patchRntrc("tipo_transportador", next)} readOnly={readOnly} className="xl:col-span-3" />
              </div>
            </Section>
          </div>
        ) : null}

        {activeTab === "dados" ? (
          <div className="space-y-4">
            <Section title="Endereco">
              <AddressForm
                value={value.endereco}
                readOnly={readOnly}
                onChange={(nextEndereco) => onChange({ ...value, endereco: nextEndereco })}
              />
            </Section>

            <Section title="Telefone">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Tipo" value={value.telefone_tipo} onChange={(next) => patch("telefone_tipo", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Numero" value={value.telefone_numero} onChange={(next) => patch("telefone_numero", next)} readOnly={readOnly} className="xl:col-span-5" />
              </div>
            </Section>
          </div>
        ) : null}

        {activeTab === "outros" ? (
          <Section title="Outros dados">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <Field label="Modalidade" value={value.modalidade} onChange={(next) => patch("modalidade", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Situacao" value={value.situacao} onChange={(next) => patch("situacao", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Email" type="email" value={value.email} onChange={(next) => patch("email", next)} readOnly={readOnly} className="xl:col-span-6" />
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
