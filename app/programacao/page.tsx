import { DashboardLayout } from "@/components/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { SumarioExecutivo } from "@/components/SumarioExecutivo";
import { CommandCenter } from "@/components/programacao/CommandCenter";
import { listComposicoesAtivas } from "@/services/composicoes";
import { listProgramacaoCargasComSLA } from "@/services/cargas";
import type { ProgramacaoCargaComSLA, SumarioExecutivo as SumarioExecutivoData } from "@/types";
import type { ServiceResult } from "@/services/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const REQUEST_TIMEOUT_MS = 7000;

function normalizeError(error: unknown, label: string) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("fetch failed")) {
    return `${label}: falha de conexão com o Supabase. Verifique internet/URL do projeto.`;
  }
  return `${label}: ${message}`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    }),
  ]);
}

async function safeServiceCall<T>(
  label: string,
  fallback: T,
  operation: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> {
  try {
    return await withTimeout(operation(), REQUEST_TIMEOUT_MS);
  } catch (error) {
    return {
      data: fallback,
      error: normalizeError(error, label),
    };
  }
}

function buildSumario(cargas: ProgramacaoCargaComSLA[]): SumarioExecutivoData {
  const emAberto = cargas.filter((c) => c.status_viagem !== "concluida");
  return {
    totalCritico: emAberto.filter((c) => c.prioridade === "critico").length,
    aguardandoMotorista: emAberto.filter((c) => !c.composicao_id).length,
    emTransito: emAberto.filter((c) => c.status_viagem === "programada" && c.composicao_id).length,
    totalCargas: emAberto.length,
  };
}

export default async function ProgramacaoPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [cargasResult, composicoesResult] = await Promise.all([
    safeServiceCall("Programação", [], () => listProgramacaoCargasComSLA(supabase)),
    safeServiceCall("Composições", [], () => listComposicoesAtivas(supabase)),
  ]);
  const sumario = buildSumario(cargasResult.data);

  const warning = cargasResult.error ?? composicoesResult.error;

  return (
    <DashboardLayout>
      <PageContainer>
        <SumarioExecutivo sumario={sumario} />

        {warning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Aviso de integração: {warning}
          </div>
        )}

        <CommandCenter
          initialCargas={cargasResult.data}
          initialComposicoes={composicoesResult.data}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
