"use client";

import { useState } from "react";
import { buscarDadosCnpj, type CnpjSearchData } from "@/services/cnpj";
import { normalizeDocument, validators } from "@/services/validators";

const cnpjCache = new Map<string, CnpjSearchData>();

interface UseCnpjSearchResult {
  buscarCnpj: (cnpj: string) => Promise<CnpjSearchData | null>;
  loading: boolean;
  error: string | null;
  data: CnpjSearchData | null;
}

export function useCnpjSearch(): UseCnpjSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CnpjSearchData | null>(null);

  const buscarCnpj = async (cnpj: string): Promise<CnpjSearchData | null> => {
    const normalizedCnpj = normalizeDocument(cnpj);

    if (!validators.cnpj(normalizedCnpj)) {
      setError("CNPJ inválido");
      setData(null);
      return null;
    }

    const cached = cnpjCache.get(normalizedCnpj);
    if (cached) {
      setError(null);
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await buscarDadosCnpj(normalizedCnpj);
      cnpjCache.set(normalizedCnpj, result);
      setData(result);
      return result;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Erro ao buscar dados";
      setError(message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    buscarCnpj,
    loading,
    error,
    data,
  };
}