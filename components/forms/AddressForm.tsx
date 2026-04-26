"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buscarCEP } from "@/services/cep";
import type { CadastroEndereco } from "@/types";

interface AddressFormProps {
  value: CadastroEndereco;
  readOnly: boolean;
  onChange: (next: CadastroEndereco) => void;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function AddressForm({ value, readOnly, onChange }: AddressFormProps) {
  const [cepInput, setCepInput] = useState(formatCep(value.cep ?? ""));
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isCepLookupError, setIsCepLookupError] = useState(false);
  const numeroInputRef = useRef<HTMLInputElement | null>(null);
  const latestValueRef = useRef(value);
  const latestOnChangeRef = useRef(onChange);
  const cepErrorTimeoutRef = useRef<number | null>(null);
  const cepDigits = onlyDigits(cepInput);

  useEffect(() => {
    setCepInput(formatCep(value.cep ?? ""));
  }, [value.cep]);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    latestOnChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (cepErrorTimeoutRef.current) {
        window.clearTimeout(cepErrorTimeoutRef.current);
      }
    };
  }, []);

  const updateAddress = (field: keyof CadastroEndereco, next: string) => {
    const normalizedValue = field === "complemento" ? next || null : next;
    onChange({ ...value, [field]: normalizedValue } as CadastroEndereco);
  };

  const handleCepSearch = async () => {
    if (readOnly) {
      return;
    }

    if (cepDigits.length !== 8) {
      return;
    }

    setIsSearchingCep(true);

    try {
      const result = await buscarCEP(cepDigits);

      setIsCepLookupError(false);

      latestOnChangeRef.current({
        ...latestValueRef.current,
        cep: cepDigits,
        logradouro: result.logradouro,
        complemento: result.complemento || null,
        bairro: result.bairro,
        municipio: result.municipio,
        uf: result.uf.toUpperCase(),
      });

      numeroInputRef.current?.focus();
    } catch {
      if (cepErrorTimeoutRef.current) {
        window.clearTimeout(cepErrorTimeoutRef.current);
      }

      setIsCepLookupError(true);

      cepErrorTimeoutRef.current = window.setTimeout(() => {
        setIsCepLookupError(false);
        cepErrorTimeoutRef.current = null;
      }, 650);
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Tipo</span>
        <Input value={value.tipo ?? ""} onChange={(event) => updateAddress("tipo", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">CEP</span>
        <div className={isCepLookupError ? "relative animate-cep-error-shake" : "relative"}>
          <Input
            value={cepInput}
            onChange={(event) => {
              const formattedCep = formatCep(event.target.value);
              setCepInput(formattedCep);
              setIsCepLookupError(false);
              updateAddress("cep", onlyDigits(formattedCep));
            }}
            readOnly={readOnly}
            placeholder="00000-000"
            maxLength={9}
            className={isCepLookupError ? "pr-11 border-red-500 focus-visible:ring-red-500 animate-cep-error-pulse" : "pr-11"}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCepSearch}
            disabled={readOnly || isSearchingCep || cepDigits.length !== 8}
            className="absolute right-0 top-0 h-10 w-10 text-slate-500 hover:text-slate-900"
            aria-label="Buscar CEP"
          >
            {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Logradouro</span>
        <Input value={value.logradouro ?? ""} onChange={(event) => updateAddress("logradouro", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Numero</span>
        <Input ref={numeroInputRef} value={value.numero ?? ""} onChange={(event) => updateAddress("numero", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Complemento</span>
        <Input value={value.complemento ?? ""} onChange={(event) => updateAddress("complemento", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Bairro</span>
        <Input value={value.bairro ?? ""} onChange={(event) => updateAddress("bairro", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">Municipio</span>
        <Input value={value.municipio ?? ""} onChange={(event) => updateAddress("municipio", event.target.value)} readOnly={readOnly} />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">UF</span>
        <Input value={value.uf ?? ""} onChange={(event) => updateAddress("uf", event.target.value.toUpperCase().slice(0, 2))} readOnly={readOnly} maxLength={2} />
      </label>
    </div>
  );
}