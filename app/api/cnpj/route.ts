import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface BrasilApiCnpjResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  descricao_situacao_cadastral?: string;
  natureza_juridica?: string;
  email?: string;
  ddd_telefone_1?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
}

function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

interface UpstreamErrorPayload {
  message?: string;
  errors?: Array<{ message?: string }>;
}

async function fetchBrasilApiCnpj(cnpj: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "LogFlow/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const rawCnpj = request.nextUrl.searchParams.get("cnpj") ?? "";
  const cnpj = normalizeCnpj(rawCnpj);

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido ou mal formatado." }, { status: 400 });
  }

  try {
    // Retry curto para oscilações transitórias da API externa.
    let response = await fetchBrasilApiCnpj(cnpj);

    if (response.status >= 500) {
      response = await fetchBrasilApiCnpj(cnpj);
    }

    if (response.status === 404) {
      return NextResponse.json({ error: "CNPJ não encontrado na API Minha Receita." }, { status: 404 });
    }

    if (response.status === 429) {
      return NextResponse.json({ error: "Limite de consultas excedido. Tente novamente em instantes." }, { status: 429 });
    }

    if (!response.ok) {
      try {
        await response.json() as UpstreamErrorPayload;
      } catch {
        // Mantem mensagem padrao em caso de payload nao-JSON.
      }

      return NextResponse.json({ error: "Erro externo ao consultar CNPJ." }, { status: 502 });
    }

    const responseText = await response.text();
    let payload: BrasilApiCnpjResponse;

    try {
      payload = JSON.parse(responseText) as BrasilApiCnpjResponse;
    } catch {
      return NextResponse.json({ error: "Erro externo ao consultar CNPJ." }, { status: 502 });
    }

    return NextResponse.json(
      {
        data: {
          cnpj,
          razaoSocial: payload.razao_social ?? "",
          nomeFantasia: payload.nome_fantasia ?? "",
          cnae: payload.cnae_fiscal ? String(payload.cnae_fiscal) : "",
          atividadeFiscal: payload.cnae_fiscal_descricao ?? "",
          regimeTributario: payload.natureza_juridica ?? payload.descricao_situacao_cadastral ?? "",
          email: payload.email ?? "",
          telefone: payload.ddd_telefone_1 ?? "",
          endereco: {
            cep: normalizeCnpj(payload.cep ?? "").slice(0, 8),
            logradouro: payload.logradouro ?? "",
            numero: payload.numero ?? "",
            complemento: payload.complemento ?? "",
            bairro: payload.bairro ?? "",
            municipio: payload.municipio ?? "",
            uf: (payload.uf ?? "").toUpperCase(),
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Erro externo ao consultar CNPJ." }, { status: 502 });
  }
}