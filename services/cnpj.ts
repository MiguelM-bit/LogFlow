import { normalizeDocument } from "@/services/validators";

export interface CnpjSearchData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  atividadeFiscal: string;
  regimeTributario: string;
  email: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
  };
}

interface CnpjApiResponse {
  data?: CnpjSearchData;
  error?: string;
}

function getDefaultErrorByStatus(status: number): string {
  if (status === 404) {
    return "CNPJ não encontrado";
  }

  if (status === 400) {
    return "CNPJ inválido";
  }

  if (status === 429) {
    return "Erro ao buscar dados";
  }

  return "Erro ao buscar dados";
}

export async function buscarDadosCnpj(cnpj: string): Promise<CnpjSearchData> {
  const normalizedCnpj = normalizeDocument(cnpj);

  const response = await fetch(`/api/cnpj?cnpj=${normalizedCnpj}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as CnpjApiResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? getDefaultErrorByStatus(response.status));
  }

  if (!payload.data) {
    throw new Error("Erro ao buscar dados");
  }

  return payload.data;
}