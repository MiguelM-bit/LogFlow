"use client";

import type { PessoaFisica } from "@/types";
import { AddressForm } from "@/components/forms/AddressForm";
import { Field } from "@/components/cadastros/shared/Field";
import { Section } from "@/components/cadastros/shared/Section";
import { TabGroup } from "@/components/cadastros/shared/TabGroup";
import { Badge } from "@/components/ui/badge";
import { formatCPF, normalizeDocument, validators } from "@/services/validators";
import { useMemo, useState } from "react";

export interface PessoaFisicaAuthData {
  createAccount: boolean;
  password: string;
  confirmPassword: string;
}

interface PessoaFisicaFormProps {
  value: PessoaFisica;
  readOnly: boolean;
  onChange: (next: PessoaFisica) => void;
  authData?: PessoaFisicaAuthData;
  onAuthDataChange?: (data: PessoaFisicaAuthData) => void;
}

const tabs = [
  { id: "identificacao", label: "Identificacao" },
  { id: "documentos", label: "Documentos" },
  { id: "endereco", label: "Endereco" },
  { id: "outros", label: "Outros" },
];

const statusOptions = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
  { label: "Pendente", value: "pendente" },
];

function isUnder18(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const birthDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age < 18;
}

export function PessoaFisicaForm({
  value,
  readOnly,
  onChange,
  authData = { createAccount: false, password: "", confirmPassword: "" },
  onAuthDataChange,
}: PessoaFisicaFormProps) {
  const [activeTab, setActiveTab] = useState("identificacao");
  const [createAccount, setCreateAccount] = useState(authData.createAccount);
  const [password, setPassword] = useState(authData.password);
  const [confirmPassword, setConfirmPassword] = useState(authData.confirmPassword);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const cpfDigits = normalizeDocument(value.cpf);
  const isCpfComplete = cpfDigits.length === 11;
  const isCpfInvalid = isCpfComplete && !validators.cpf(cpfDigits);
  const isBirthDateUnder18 = isUnder18(value.data_nascimento);

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

  const patch = (field: keyof PessoaFisica, next: string) => {
    onChange({ ...value, [field]: next || null });
  };

  const patchRntrc = (field: keyof NonNullable<PessoaFisica["rntrc"]>, next: string) => {
    onChange({
      ...value,
      rntrc: {
        ...rntrc,
        [field]: next || null,
      },
    });
  };

  const handleCreateAccountChange = (checked: boolean) => {
    setCreateAccount(checked);
    setPasswordError(null);
    if (!checked) {
      setPassword("");
      setConfirmPassword("");
    }
    if (onAuthDataChange) {
      onAuthDataChange({
        createAccount: checked,
        password: checked ? password : "",
        confirmPassword: checked ? confirmPassword : "",
      });
    }
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    setPasswordError(null);
    if (onAuthDataChange) {
      onAuthDataChange({
        createAccount,
        password: newPassword,
        confirmPassword,
      });
    }
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    setPasswordError(null);
    if (onAuthDataChange) {
      onAuthDataChange({
        createAccount,
        password,
        confirmPassword: newConfirmPassword,
      });
    }
  };

  const invalidTabs = useMemo(() => {
    const tabs: string[] = [];
    if (isCpfInvalid || isBirthDateUnder18) {
      tabs.push("identificacao");
    }
    return tabs;
  }, [isCpfInvalid, isBirthDateUnder18]);

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[color:var(--color-foreground)]">Pessoa Fisica</h2>
          <Badge variant={value.status === "ativo" ? "success" : "secondary"}>{value.status}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <Field
            label="CPF"
            value={formatCPF(value.cpf)}
            onChange={(next) => onChange({ ...value, cpf: formatCPF(next) })}
            readOnly={readOnly}
            required
            invalid={isCpfInvalid}
            errorMessage="CPF inválido"
            className="xl:col-span-3"
          />
          <Field
            label="Nome"
            value={value.nome}
            onChange={(next) => onChange({ ...value, nome: next })}
            readOnly={readOnly}
            required
            className="xl:col-span-4"
          />
          <Field
            label="Nascimento"
            type="date"
            value={value.data_nascimento}
            onChange={(next) => patch("data_nascimento", next)}
            readOnly={readOnly}
            invalid={isBirthDateUnder18}
            errorMessage="Idade minima de 18 anos"
            className="xl:col-span-2"
          />
          <Field label="Telefone" value={value.telefone} onChange={(next) => patch("telefone", next)} readOnly={readOnly} className="xl:col-span-2" />
          <Field label="Status" value={value.status} onChange={(next) => onChange({ ...value, status: next as PessoaFisica["status"] })} readOnly={readOnly} options={statusOptions} className="xl:col-span-1" />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <TabGroup tabs={tabs} active={activeTab} onChange={setActiveTab} invalidTabs={invalidTabs} />

        {activeTab === "identificacao" ? (
          <Section title="Identificacao">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <Field label="Nacionalidade" value={value.nacionalidade} onChange={(next) => patch("nacionalidade", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Naturalidade" value={value.naturalidade} onChange={(next) => patch("naturalidade", next)} readOnly={readOnly} className="xl:col-span-3" />
              <Field label="Grau instrucao" value={value.grau_instrucao} onChange={(next) => patch("grau_instrucao", next)} readOnly={readOnly} className="xl:col-span-2" />
              <Field label="Estado civil" value={value.estado_civil} onChange={(next) => patch("estado_civil", next)} readOnly={readOnly} className="xl:col-span-2" />
              <Field label="Raca/Cor" value={value.raca_cor} onChange={(next) => patch("raca_cor", next)} readOnly={readOnly} className="xl:col-span-2" />
            </div>
          </Section>
        ) : null}

        {activeTab === "documentos" ? (
          <div className="space-y-4">
            <Section title="RG">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Numero" value={value.rg_numero} onChange={(next) => patch("rg_numero", next)} readOnly={readOnly} className="xl:col-span-4" />
                <Field label="Orgao expedidor" value={value.rg_orgao_expedidor} onChange={(next) => patch("rg_orgao_expedidor", next)} readOnly={readOnly} className="xl:col-span-4" />
                <Field label="UF" value={value.rg_uf} onChange={(next) => patch("rg_uf", next)} readOnly={readOnly} className="xl:col-span-2" />
                <Field label="Data emissao" type="date" value={value.rg_data_emissao} onChange={(next) => patch("rg_data_emissao", next)} readOnly={readOnly} className="xl:col-span-2" />
              </div>
            </Section>

            <Section title="CNH">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Numero" value={value.cnh_numero} onChange={(next) => patch("cnh_numero", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Registro" value={value.cnh_registro} onChange={(next) => patch("cnh_registro", next)} readOnly={readOnly} className="xl:col-span-2" />
                <Field label="Codigo seguranca" value={value.cnh_codigo_seguranca} onChange={(next) => patch("cnh_codigo_seguranca", next)} readOnly={readOnly} className="xl:col-span-2" />
                <Field label="Renach" value={value.cnh_renach} onChange={(next) => patch("cnh_renach", next)} readOnly={readOnly} className="xl:col-span-2" />
                <Field label="Categoria" value={value.cnh_categoria} onChange={(next) => patch("cnh_categoria", next)} readOnly={readOnly} className="xl:col-span-1" />
                <Field label="UF" value={value.cnh_uf} onChange={(next) => patch("cnh_uf", next)} readOnly={readOnly} className="xl:col-span-1" />
                <Field label="Orgao emissor" value={value.cnh_orgao_emissor} onChange={(next) => patch("cnh_orgao_emissor", next)} readOnly={readOnly} className="xl:col-span-1" />
                <Field label="1a habilitacao" type="date" value={value.cnh_data_primeira_habilitacao} onChange={(next) => patch("cnh_data_primeira_habilitacao", next)} readOnly={readOnly} className="xl:col-span-4" />
                <Field label="Data emissao" type="date" value={value.cnh_data_emissao} onChange={(next) => patch("cnh_data_emissao", next)} readOnly={readOnly} className="xl:col-span-4" />
                <Field label="Validade" type="date" value={value.cnh_validade} onChange={(next) => patch("cnh_validade", next)} readOnly={readOnly} className="xl:col-span-4" />
              </div>
            </Section>

            <Section title="RNTRC (opcional)">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Numero" value={rntrc.numero} onChange={(next) => patchRntrc("numero", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Data emissao" type="date" value={rntrc.data_emissao} onChange={(next) => patchRntrc("data_emissao", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Validade" type="date" value={rntrc.validade} onChange={(next) => patchRntrc("validade", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Tipo transportador" value={rntrc.tipo_transportador} onChange={(next) => patchRntrc("tipo_transportador", next)} readOnly={readOnly} className="xl:col-span-3" />
              </div>
            </Section>
          </div>
        ) : null}

        {activeTab === "endereco" ? (
          <Section title="Endereco">
            <AddressForm
              value={value.endereco}
              readOnly={readOnly}
              onChange={(nextEndereco) => onChange({ ...value, endereco: nextEndereco })}
            />
          </Section>
        ) : null}

        {activeTab === "outros" ? (
          <div className="space-y-4">
            <Section title="Outros dados">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                <Field label="Modalidade" value={value.modalidade} onChange={(next) => patch("modalidade", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Situacao" value={value.situacao} onChange={(next) => patch("situacao", next)} readOnly={readOnly} className="xl:col-span-3" />
                <Field label="Email" type="email" value={value.email} onChange={(next) => patch("email", next)} readOnly={readOnly} className="xl:col-span-6" />
                <Field label="Filiacao (pai)" value={value.filiacao_pai} onChange={(next) => patch("filiacao_pai", next)} readOnly={readOnly} className="xl:col-span-6" />
                <Field label="Filiacao (mae)" value={value.filiacao_mae} onChange={(next) => patch("filiacao_mae", next)} readOnly={readOnly} className="xl:col-span-6" />
              </div>
            </Section>

            <Section title="Acesso ao Aplicativo">
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => handleCreateAccountChange(e.target.checked)}
                    disabled={readOnly}
                    className="h-4 w-4 rounded border border-[color:var(--color-border)] cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-[color:var(--color-foreground)]">
                    Criar acesso ao aplicativo
                  </span>
                </label>

                {createAccount && !readOnly ? (
                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <Field
                      label="Senha"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      readOnly={readOnly}
                      required
                      placeholder="Mínimo 6 caracteres"
                      invalid={Boolean(passwordError)}
                      className="xl:col-span-6"
                    />
                    <Field
                      label="Confirmar Senha"
                      type="password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      readOnly={readOnly}
                      required
                      placeholder="Repita a senha"
                      invalid={Boolean(passwordError)}
                      className="xl:col-span-6"
                    />
                    {passwordError ? (
                      <p className="text-xs text-red-600 font-medium">{passwordError}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
