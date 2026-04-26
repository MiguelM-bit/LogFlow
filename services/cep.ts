export interface CepData {
  logradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
  complemento: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const cepCache = new Map<string, CepData>();
const inFlightRequests = new Map<string, Promise<CepData>>();

function sanitizeCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

function normalizeCepPayload(payload: ViaCepResponse): CepData {
  return {
    logradouro: payload.logradouro ?? "",
    bairro: payload.bairro ?? "",
    municipio: payload.localidade ?? "",
    uf: payload.uf ?? "",
    complemento: payload.complemento ?? "",
  };
}

async function fetchViaCep(cep: string): Promise<CepData> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

  if (!response.ok) {
    throw new Error("Erro de rede");
  }

  const payload = (await response.json()) as ViaCepResponse;

  if (payload.erro) {
    throw new Error("CEP não encontrado");
  }

  return normalizeCepPayload(payload);
}

export async function buscarCEP(cep: string): Promise<CepData> {
  const sanitizedCep = sanitizeCep(cep);

  if (sanitizedCep.length !== 8) {
    throw new Error("CEP inválido");
  }

  const cached = cepCache.get(sanitizedCep);
  if (cached) {
    return cached;
  }

  const pending = inFlightRequests.get(sanitizedCep);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const data = await fetchViaCep(sanitizedCep);
        cepCache.set(sanitizedCep, data);
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro de rede";

        if (message === "CEP inválido" || message === "CEP não encontrado") {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw new Error("Erro de rede");
        }
      }
    }

    throw new Error("Erro de rede");
  })();

  inFlightRequests.set(sanitizedCep, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(sanitizedCep);
  }
}