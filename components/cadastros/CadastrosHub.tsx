"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormActions } from "@/components/cadastros/shared/FormActions";
import { TabGroup } from "@/components/cadastros/shared/TabGroup";
import { PessoaFisicaForm, type PessoaFisicaAuthData } from "@/components/cadastros/PessoaFisicaForm";
import { PessoaJuridicaForm } from "@/components/cadastros/PessoaJuridicaForm";
import { VeiculoForm } from "@/components/cadastros/VeiculoForm";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type {
  CadastroSearchItem,
  Empresa,
  PessoaFisica,
  VeiculoCadastro,
} from "@/types";
import {
  getPessoaFisicaById,
  isCpfAlreadyRegistered,
  searchPessoasFisicas,
  upsertPessoaFisica,
} from "@/services/pessoas";
import {
  getEmpresaById,
  isCnpjAlreadyRegistered,
  searchEmpresas,
  upsertEmpresa,
} from "@/services/empresas";
import { normalizeDocument, validators } from "@/services/validators";
import {
  getVeiculoCadastroById,
  searchVeiculosCadastro,
  upsertVeiculoCadastro,
} from "@/services/veiculos";
import { createAuthUser } from "@/services/authService";

const MODULES = [
  { id: "pf", label: "Pessoa Fisica" },
  { id: "pj", label: "Pessoa Juridica" },
  { id: "veiculo", label: "Veiculos" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

interface CadastrosHubProps {
  initialModule?: ModuleId;
  initialEmpresas: Array<Pick<Empresa, "id" | "cnpj" | "razao_social" | "modalidade">>;
  initialWarning?: string | null;
}

type ViewMode = "form" | "results";

const EMPTY_ENDERECO = {
  tipo: "Comercial",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: null,
  bairro: "",
  municipio: "",
  uf: "",
};

const EMPTY_PF: PessoaFisica = {
  id: "",
  cpf: "",
  nome: "",
  data_nascimento: null,
  telefone: null,
  status: "ativo",
  nacionalidade: null,
  naturalidade: null,
  grau_instrucao: null,
  estado_civil: null,
  raca_cor: null,
  rg_numero: null,
  rg_orgao_expedidor: null,
  rg_uf: null,
  rg_data_emissao: null,
  cnh_numero: null,
  cnh_registro: null,
  cnh_codigo_seguranca: null,
  cnh_renach: null,
  cnh_data_primeira_habilitacao: null,
  cnh_data_emissao: null,
  cnh_validade: null,
  cnh_uf: null,
  cnh_categoria: null,
  cnh_orgao_emissor: null,
  modalidade: null,
  situacao: null,
  email: null,
  filiacao_pai: null,
  filiacao_mae: null,
  endereco: { ...EMPTY_ENDERECO },
  rntrc: null,
};

const EMPTY_PJ: Empresa = {
  id: "",
  cnpj: "",
  razao_social: "",
  status: "ativo",
  nome_fantasia: null,
  cnae: null,
  inscricao_estadual: null,
  atividade_fiscal: null,
  regime_tributario: null,
  modalidade: null,
  situacao: null,
  email: null,
  endereco: { ...EMPTY_ENDERECO },
  rntrc: null,
  telefone_tipo: null,
  telefone_numero: null,
};

const EMPTY_VEICULO: VeiculoCadastro = {
  id: "",
  placa: "",
  status: "ativo",
  renavam: null,
  chassis: null,
  ano: null,
  cor: null,
  municipio: null,
  marca: null,
  modelo: null,
  agrupamento: null,
  classificacao: null,
  modalidade: null,
  situacao: null,
  proprietario_empresa_id: null,
  proprietario_cnpj_documento: null,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function CadastrosHub({
  initialModule,
  initialEmpresas,
  initialWarning,
}: CadastrosHubProps) {
  const [moduleId, setModuleId] = useState<ModuleId>(initialModule ?? "pf");
  const [queries, setQueries] = useState<Record<ModuleId, string>>({ pf: "", pj: "", veiculo: "" });
  const [results, setResults] = useState<Record<ModuleId, CadastroSearchItem[]>>({
    pf: [],
    pj: [],
    veiculo: [],
  });
  const [selectedId, setSelectedId] = useState<Record<ModuleId, string | null>>({ pf: null, pj: null, veiculo: null });
  const [readOnly, setReadOnly] = useState<Record<ModuleId, boolean>>({ pf: false, pj: false, veiculo: false });
  const [viewMode, setViewMode] = useState<Record<ModuleId, ViewMode>>({ pf: "form", pj: "form", veiculo: "form" });
  const [hasSearched, setHasSearched] = useState<Record<ModuleId, boolean>>({ pf: false, pj: false, veiculo: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialWarning ?? null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [pf, setPf] = useState<PessoaFisica>(EMPTY_PF);
  const [pj, setPj] = useState<Empresa>(EMPTY_PJ);
  const [veiculo, setVeiculo] = useState<VeiculoCadastro>(EMPTY_VEICULO);
  const [snapshot, setSnapshot] = useState<Record<ModuleId, PessoaFisica | Empresa | VeiculoCadastro | null>>({
    pf: null,
    pj: null,
    veiculo: null,
  });
  const [pfAuthData, setPfAuthData] = useState<PessoaFisicaAuthData>({
    createAccount: false,
    password: "",
    confirmPassword: "",
  });

  const searchPlaceholder = useMemo(() => {
    if (moduleId === "pf") return "Buscar por nome ou CPF";
    if (moduleId === "pj") return "Buscar por razao social ou CNPJ";
    return "Buscar por placa, marca ou modelo";
  }, [moduleId]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimeoutRef.current = null;
    }, 2500);
  };

  const saveTone = useMemo<"default" | "warning" | "danger">(() => {
    if (!error) return "default";

    const normalizedError = error.toLowerCase();

    if (
      normalizedError.includes("inválido") ||
      normalizedError.includes("ja existe") ||
      normalizedError.includes("já existe")
    ) {
      return "danger";
    }

    if (
      normalizedError.includes("exige") ||
      normalizedError.includes("digite um termo")
    ) {
      return "warning";
    }

    return "default";
  }, [error]);

  const executeSearch = async (targetModule: ModuleId, query: string, showResults: boolean) => {
    const term = query.trim();

    if (!term) {
      setError("Digite um termo para buscar. Use % para listar todos os registros.");
      setResults((prev) => ({ ...prev, [targetModule]: [] }));
      setHasSearched((prev) => ({ ...prev, [targetModule]: true }));
      return false;
    }

    setLoading(true);
    setError(null);

    const response =
      targetModule === "pf"
        ? await searchPessoasFisicas(supabase, term)
        : targetModule === "pj"
          ? await searchEmpresas(supabase, term)
          : await searchVeiculosCadastro(supabase, term);

    setLoading(false);
    if (response.error) {
      setError(response.error);
      return false;
    }

    setResults((prev) => ({ ...prev, [targetModule]: response.data }));
    setSelectedId((prev) => ({ ...prev, [targetModule]: null }));
    setReadOnly((prev) => ({ ...prev, [targetModule]: false }));
    setHasSearched((prev) => ({ ...prev, [targetModule]: true }));

    if (showResults) {
      setViewMode((prev) => ({ ...prev, [targetModule]: "results" }));
    }

    return true;
  };

  const handleSearch = async () => {
    await executeSearch(moduleId, queries[moduleId], true);
  };

  const handleSelect = async (id: string) => {
    setLoading(true);
    setError(null);

    const response =
      moduleId === "pf"
        ? await getPessoaFisicaById(supabase, id)
        : moduleId === "pj"
          ? await getEmpresaById(supabase, id)
          : await getVeiculoCadastroById(supabase, id);

    setLoading(false);
    if (response.error || !response.data) {
      setError(response.error ?? "Registro nao encontrado.");
      return;
    }

    if (moduleId === "pf") setPf(response.data as PessoaFisica);
    if (moduleId === "pj") setPj(response.data as Empresa);
    if (moduleId === "veiculo") setVeiculo(response.data as VeiculoCadastro);

    setSelectedId((prev) => ({ ...prev, [moduleId]: id }));
    setReadOnly((prev) => ({ ...prev, [moduleId]: true }));
    setSnapshot((prev) => ({ ...prev, [moduleId]: clone(response.data) }));
    setViewMode((prev) => ({ ...prev, [moduleId]: "form" }));
  };

  const handleEdit = () => {
    if (moduleId === "pf") setSnapshot((prev) => ({ ...prev, pf: clone(pf) }));
    if (moduleId === "pj") setSnapshot((prev) => ({ ...prev, pj: clone(pj) }));
    if (moduleId === "veiculo") setSnapshot((prev) => ({ ...prev, veiculo: clone(veiculo) }));
    setReadOnly((prev) => ({ ...prev, [moduleId]: false }));
  };

  const resetCurrentForm = (target: ModuleId) => {
    if (target === "pf") setPf(clone(EMPTY_PF));
    if (target === "pj") setPj(clone(EMPTY_PJ));
    if (target === "veiculo") setVeiculo(clone(EMPTY_VEICULO));
  };

  const handleCreateNew = () => {
    resetCurrentForm(moduleId);
    setSelectedId((prev) => ({ ...prev, [moduleId]: null }));
    setSnapshot((prev) => ({ ...prev, [moduleId]: null }));
    setReadOnly((prev) => ({ ...prev, [moduleId]: false }));
    setError(null);
    setFeedbackMessage(null);
    setViewMode((prev) => ({ ...prev, [moduleId]: "form" }));
  };

  const handleCancel = () => {
    const moduleSnapshot = snapshot[moduleId];
    if (moduleSnapshot) {
      if (moduleId === "pf") setPf(moduleSnapshot as PessoaFisica);
      if (moduleId === "pj") setPj(moduleSnapshot as Empresa);
      if (moduleId === "veiculo") setVeiculo(moduleSnapshot as VeiculoCadastro);
      setReadOnly((prev) => ({ ...prev, [moduleId]: true }));
    } else {
      resetCurrentForm(moduleId);
      setReadOnly((prev) => ({ ...prev, [moduleId]: false }));
    }

    setError(null);
    setFeedbackMessage(null);
  };

  const handleSave = async () => {
    if (!window.confirm("Confirma salvar as alteracoes?")) {
      return;
    }

    const normalizedCpf = normalizeDocument(pf.cpf);
    const normalizedCnpj = normalizeDocument(pj.cnpj);

    if (moduleId === "pf") {
      if (!validators.cpf(normalizedCpf)) {
        setError("CPF inválido");
        return;
      }

      const duplicateCpf = await isCpfAlreadyRegistered(supabase, normalizedCpf, pf.id || undefined);
      if (duplicateCpf.error) {
        setError(duplicateCpf.error);
        return;
      }
      if (duplicateCpf.data) {
        setError("Já existe um cadastro com este CPF/CNPJ");
        return;
      }
    }

    if (moduleId === "pj") {
      if (!validators.cnpj(normalizedCnpj)) {
        setError("CNPJ inválido");
        return;
      }

      const duplicateCnpj = await isCnpjAlreadyRegistered(supabase, normalizedCnpj, pj.id || undefined);
      if (duplicateCnpj.error) {
        setError(duplicateCnpj.error);
        return;
      }
      if (duplicateCnpj.data) {
        setError("Já existe um cadastro com este CPF/CNPJ");
        return;
      }
    }

    if (moduleId === "veiculo" && veiculo.modalidade?.toLowerCase() === "proprietario" && !veiculo.proprietario_empresa_id) {
      setError("Modalidade proprietario exige empresa vinculada.");
      return;
    }

    setSaving(true);
    setError(null);
    setFeedbackMessage(null);

    const pfPayload = {
      cpf: normalizedCpf,
      nome: pf.nome,
      data_nascimento: pf.data_nascimento,
      telefone: pf.telefone,
      status: pf.status,
      nacionalidade: pf.nacionalidade,
      naturalidade: pf.naturalidade,
      grau_instrucao: pf.grau_instrucao,
      estado_civil: pf.estado_civil,
      raca_cor: pf.raca_cor,
      rg_numero: pf.rg_numero,
      rg_orgao_expedidor: pf.rg_orgao_expedidor,
      rg_uf: pf.rg_uf,
      rg_data_emissao: pf.rg_data_emissao,
      cnh_numero: pf.cnh_numero,
      cnh_registro: pf.cnh_registro,
      cnh_codigo_seguranca: pf.cnh_codigo_seguranca,
      cnh_renach: pf.cnh_renach,
      cnh_data_primeira_habilitacao: pf.cnh_data_primeira_habilitacao,
      cnh_data_emissao: pf.cnh_data_emissao,
      cnh_validade: pf.cnh_validade,
      cnh_uf: pf.cnh_uf,
      cnh_categoria: pf.cnh_categoria,
      cnh_orgao_emissor: pf.cnh_orgao_emissor,
      modalidade: pf.modalidade,
      situacao: pf.situacao,
      email: pf.email,
      filiacao_pai: pf.filiacao_pai,
      filiacao_mae: pf.filiacao_mae,
      endereco: pf.endereco,
      rntrc: pf.rntrc,
    };

    const pjPayload = {
      cnpj: normalizedCnpj,
      razao_social: pj.razao_social,
      status: pj.status,
      nome_fantasia: pj.nome_fantasia,
      cnae: pj.cnae,
      inscricao_estadual: pj.inscricao_estadual,
      atividade_fiscal: pj.atividade_fiscal,
      regime_tributario: pj.regime_tributario,
      modalidade: pj.modalidade,
      situacao: pj.situacao,
      email: pj.email,
      endereco: pj.endereco,
      rntrc: pj.rntrc,
      telefone_tipo: pj.telefone_tipo,
      telefone_numero: pj.telefone_numero,
    };

    const veiculoPayload = {
      placa: veiculo.placa,
      status: veiculo.status,
      renavam: veiculo.renavam,
      chassis: veiculo.chassis,
      ano: veiculo.ano,
      cor: veiculo.cor,
      municipio: veiculo.municipio,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      agrupamento: veiculo.agrupamento,
      classificacao: veiculo.classificacao,
      modalidade: veiculo.modalidade,
      situacao: veiculo.situacao,
      proprietario_empresa_id: veiculo.proprietario_empresa_id,
      proprietario_cnpj_documento: veiculo.proprietario_cnpj_documento,
    };

    const response =
      moduleId === "pf"
        ? await upsertPessoaFisica(supabase, { id: pf.id || undefined, data: pfPayload })
        : moduleId === "pj"
          ? await upsertEmpresa(supabase, { id: pj.id || undefined, data: pjPayload })
          : await upsertVeiculoCadastro(supabase, {
              id: veiculo.id || undefined,
              data: veiculoPayload,
            });

    setSaving(false);

    if (response.error || !response.data) {
      setError(response.error ?? "Falha ao salvar.");
      return;
    }

    // Handle auth user creation for pessoa fisica
    if (moduleId === "pf" && pfAuthData.createAccount) {
      // Validate passwords
      if (!pfAuthData.password || !pfAuthData.confirmPassword) {
        setError("Preencha ambos os campos de senha");
        return;
      }

      if (pfAuthData.password.length < 6) {
        setError("Senha deve ter no mínimo 6 caracteres");
        return;
      }

      if (pfAuthData.password !== pfAuthData.confirmPassword) {
        setError("As senhas não são iguais");
        return;
      }

      // Create auth user
      const authResponse = await createAuthUser(
        supabase,
        normalizedCpf,
        pfAuthData.password,
        pf.nome,
        response.data.id
      );

      if (authResponse.error) {
        setError(`Cadastro salvo, mas falha ao criar acesso: ${authResponse.error}`);
        return;
      }

      // Clear auth data after successful creation
      setPfAuthData({
        createAccount: false,
        password: "",
        confirmPassword: "",
      });
    }

    if (moduleId === "pf") setPf(response.data as PessoaFisica);
    if (moduleId === "pj") setPj(response.data as Empresa);
    if (moduleId === "veiculo") setVeiculo(response.data as VeiculoCadastro);

    setSelectedId((prev) => ({ ...prev, [moduleId]: response.data!.id }));
    setSnapshot((prev) => ({ ...prev, [moduleId]: clone(response.data) }));
    setReadOnly((prev) => ({ ...prev, [moduleId]: true }));
    showFeedback("Cadastro salvo com sucesso.");

    if (queries[moduleId].trim()) {
      await executeSearch(moduleId, queries[moduleId], false);
    }
  };

  const currentView = viewMode[moduleId];
  const currentResults = results[moduleId];
  const hasSelectedCadastro = Boolean(selectedId[moduleId]);

  const statusLabel = (status: CadastroSearchItem["status"]) => {
    if (status === "ativo") return "Ativo";
    if (status === "inativo") return "Inativo";
    return "Pendente";
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="xl:min-w-0 xl:flex-1">
            <TabGroup
              tabs={MODULES.map((item) => ({ id: item.id, label: item.label }))}
              active={moduleId}
              onChange={(next) => {
                setModuleId(next as ModuleId);
                setError(null);
              }}
            />
          </div>

          <div className="flex w-full gap-2 xl:w-[520px]">
            <Input
              value={queries[moduleId]}
              onChange={(event) => {
                const nextValue = event.target.value;
                setQueries((prev) => ({ ...prev, [moduleId]: nextValue }));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder={searchPlaceholder}
              className="h-11"
            />
            <Button
              type="button"
              onClick={() => void handleSearch()}
              disabled={loading}
              className="h-11 px-5 bg-slate-800 text-white hover:bg-slate-700"
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="relative min-h-[640px] overflow-hidden">
        <section
          className={`rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm transition-all duration-300 ${
            currentView === "results"
              ? "relative opacity-100 translate-x-0"
              : "pointer-events-none absolute inset-0 opacity-0 -translate-x-4"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Resultados da busca</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode((prev) => ({ ...prev, [moduleId]: "form" }))}
              className="border-slate-400 bg-slate-200 text-slate-800 hover:bg-slate-300"
            >
              Voltar ao formulario
            </Button>
          </div>

          <div className="max-h-[560px] space-y-2 overflow-auto p-4">
            {currentResults.map((item) => {
              const selected = item.id === selectedId[moduleId];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleSelect(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-200 ease-out ${
                    selected
                      ? "border-primary-200 bg-primary-50"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{item.titulo}</p>
                    <Badge variant={item.status === "ativo" ? "success" : "secondary"}>
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-[color:var(--color-muted)]">{item.chave}</p>
                  {item.subtitulo ? <p className="text-xs text-[color:var(--color-muted)]">{item.subtitulo}</p> : null}
                </button>
              );
            })}

            {!loading && hasSearched[moduleId] && currentResults.length === 0 ? (
              <p className="rounded-xl border border-[color:var(--color-border)] bg-slate-50/40 px-3 py-2 text-sm text-[color:var(--color-muted)]">
                Nenhum resultado encontrado para a busca atual.
              </p>
            ) : null}
          </div>
        </section>

        <section
          className={`space-y-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm transition-all duration-300 ${
            currentView === "form"
              ? "relative opacity-100 translate-x-0"
              : "pointer-events-none absolute inset-0 opacity-0 translate-x-4"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-4">
            <div className="flex items-center gap-2">
              <Badge variant={hasSelectedCadastro ? "success" : "warning"}>
                {hasSelectedCadastro ? "Cadastro aberto" : "Novo cadastro"}
              </Badge>
              <p className="text-xs text-[color:var(--color-muted)]">
                {hasSelectedCadastro
                  ? "Use Editar para alterar este registro, ou Novo cadastro para iniciar do zero."
                  : "Formulario limpo e pronto para novo cadastro."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateNew}
                className="border-slate-400 bg-slate-200 text-slate-800 hover:bg-slate-300"
              >
                Novo cadastro
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!hasSearched[moduleId]}
                onClick={() => setViewMode((prev) => ({ ...prev, [moduleId]: "results" }))}
                className="border-slate-400 bg-slate-200 text-slate-800 hover:bg-slate-300"
              >
                Ver lista buscada
              </Button>
            </div>
          </div>

          {moduleId === "pf" ? (
            <PessoaFisicaForm
              value={pf}
              onChange={setPf}
              readOnly={readOnly.pf}
              authData={pfAuthData}
              onAuthDataChange={setPfAuthData}
            />
          ) : null}
          {moduleId === "pj" ? (
            <PessoaJuridicaForm value={pj} onChange={setPj} readOnly={readOnly.pj} />
          ) : null}
          {moduleId === "veiculo" ? (
            <VeiculoForm value={veiculo} onChange={setVeiculo} readOnly={readOnly.veiculo} empresas={initialEmpresas} />
          ) : null}

          <FormActions
            readOnly={readOnly[moduleId]}
            hasSelection={hasSelectedCadastro}
            saving={saving}
            saveTone={saveTone}
            feedbackMessage={feedbackMessage}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={() => void handleSave()}
          />
        </section>
      </div>
    </div>
  );
}
