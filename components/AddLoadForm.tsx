"use client";

import { createClient } from "@/utils/supabase/client";
import { DatabaseLoadStatus } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Package,
  Truck,
  DollarSign,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

const VEHICLE_TYPES = [
  "Caminhão Baú",
  "Caminhão Frigorífico",
  "Caminhão Graneleiro",
  "Caminhão Tanque",
  "Carreta (Cavalo + Semirreboque)",
  "Carreta Frigorífica",
  "Carreta Graneleira",
  "Carreta Tanque",
  "Bitruck",
  "Toco",
  "VUC",
  "Van Cargo",
  "Moto",
  "Outro",
];

const STATUS_OPTIONS: { value: DatabaseLoadStatus; label: string; color: string }[] = [
  { value: "disponivel", label: "Disponível", color: "text-emerald-600" },
  { value: "negociando", label: "Negociando", color: "text-amber-600" },
  { value: "programada", label: "Programada", color: "text-blue-600" },
  { value: "concluida", label: "Concluída", color: "text-slate-500" },
];

interface FormState {
  origem: string;
  destino: string;
  tipo_veiculo: string;
  valor_frete: string;
  status: DatabaseLoadStatus;
  observacoes: string;
}

const INITIAL_STATE: FormState = {
  origem: "",
  destino: "",
  tipo_veiculo: "",
  valor_frete: "",
  status: "disponivel",
  observacoes: "",
};

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.origem.trim()) errors.origem = "Informe a origem da carga.";
  if (!form.destino.trim()) errors.destino = "Informe o destino da carga.";
  if (!form.tipo_veiculo) errors.tipo_veiculo = "Selecione o tipo de veículo.";
  if (!form.valor_frete.trim()) {
    errors.valor_frete = "Informe o valor do frete.";
  } else {
    const val = parseFloat(form.valor_frete.replace(",", "."));
    if (isNaN(val) || val <= 0) errors.valor_frete = "Valor inválido. Use um número positivo.";
  }
  return errors;
}

export function AddLoadForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const supabase = createClient();

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (globalError) setGlobalError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setGlobalError(null);

    const payload = {
      origem: form.origem.trim(),
      destino: form.destino.trim(),
      tipo_veiculo: form.tipo_veiculo,
      valor_frete: parseFloat(form.valor_frete.replace(",", ".")),
      status: form.status,
      observacoes: form.observacoes.trim() || null,
    };

    const { error } = await supabase.from("cargas").insert(payload);

    setSubmitting(false);

    if (error) {
      setGlobalError(`Erro ao salvar: ${error.message}`);
      return;
    }

    setSuccessCount((n) => n + 1);
    setForm(INITIAL_STATE);
    setErrors({});
  }

  function handleReset() {
    setForm(INITIAL_STATE);
    setErrors({});
    setGlobalError(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Success Banner */}
      {successCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm animate-fadeIn">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">
              {successCount === 1
                ? "Carga cadastrada com sucesso!"
                : `${successCount} cargas cadastradas com sucesso!`}
            </p>
            <p className="text-sm text-emerald-600">A carga já aparece no Kanban em tempo real.</p>
          </div>
        </div>
      )}

      {/* Global Error */}
      {globalError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm animate-fadeIn">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{globalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Rota */}
        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="mb-5 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <MapPin className="h-4 w-4 text-sky-500" />
            Rota
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Origem */}
            <div className="space-y-2">
              <label htmlFor="origem" className="block text-sm font-semibold text-slate-700">
                Origem <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="origem"
                  type="text"
                  placeholder="Ex: São Paulo, SP"
                  value={form.origem}
                  onChange={(e) => handleChange("origem", e.target.value)}
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.origem
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100"
                  }`}
                />
              </div>
              {errors.origem && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.origem}
                </p>
              )}
            </div>

            {/* Destino */}
            <div className="space-y-2">
              <label htmlFor="destino" className="block text-sm font-semibold text-slate-700">
                Destino <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="destino"
                  type="text"
                  placeholder="Ex: Rio de Janeiro, RJ"
                  value={form.destino}
                  onChange={(e) => handleChange("destino", e.target.value)}
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.destino
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100"
                  }`}
                />
              </div>
              {errors.destino && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.destino}
                </p>
              )}
            </div>
          </div>

          {/* Rota preview */}
          {form.origem && form.destino && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 animate-fadeIn">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{form.origem}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
              <span className="truncate">{form.destino}</span>
            </div>
          )}
        </fieldset>

        {/* Veículo e Valor */}
        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="mb-5 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Truck className="h-4 w-4 text-orange-500" />
            Veículo e valor
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Tipo de veículo */}
            <div className="space-y-2">
              <label htmlFor="tipo_veiculo" className="block text-sm font-semibold text-slate-700">
                Tipo de veículo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="tipo_veiculo"
                  value={form.tipo_veiculo}
                  onChange={(e) => handleChange("tipo_veiculo", e.target.value)}
                  className={`w-full appearance-none rounded-xl border bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.tipo_veiculo
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
                  } ${!form.tipo_veiculo ? "text-slate-400" : ""}`}
                >
                  <option value="" disabled>
                    Selecione o veículo
                  </option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.tipo_veiculo && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.tipo_veiculo}
                </p>
              )}
            </div>

            {/* Valor do frete */}
            <div className="space-y-2">
              <label htmlFor="valor_frete" className="block text-sm font-semibold text-slate-700">
                Valor do frete (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="valor_frete"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 3500,00"
                  value={form.valor_frete}
                  onChange={(e) => handleChange("valor_frete", e.target.value)}
                  className={`w-full rounded-xl border bg-slate-50 py-3 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    errors.valor_frete
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                  }`}
                />
              </div>
              {errors.valor_frete && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.valor_frete}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Status */}
        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="mb-5 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Package className="h-4 w-4 text-violet-500" />
            Status inicial
          </legend>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition hover:shadow-md ${
                  form.status === opt.value
                    ? "border-violet-400 bg-violet-50 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-violet-200"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={form.status === opt.value}
                  onChange={() => handleChange("status", opt.value)}
                  className="sr-only"
                />
                {form.status === opt.value && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <span className={`text-sm font-semibold ${opt.color}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Observações */}
        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="mb-5 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="h-4 w-4 text-slate-400" />
            Observações <span className="normal-case font-normal text-slate-400">(opcional)</span>
          </legend>

          <textarea
            id="observacoes"
            rows={4}
            placeholder="Instruções de coleta, restrições de horário, tipo de mercadoria, contato do cliente..."
            value={form.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
          />
          <p className="mt-2 text-xs text-slate-400">{form.observacoes.length}/500 caracteres</p>
        </fieldset>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar formulário
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-lg active:scale-95 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Cadastrar carga
              </>
            )}
          </button>
        </div>
      </form>

      {/* Recent tip */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Dica:</span> Após cadastrar, a carga aparece
          automaticamente na coluna <span className="font-semibold">&quot;Disponível&quot;</span> do Kanban em
          tempo real — sem precisar recarregar a página.
        </p>
      </div>
    </div>
  );
}
