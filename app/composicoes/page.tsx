import { DashboardLayout } from "@/components/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ComposicoesManager } from "@/components/ComposicoesManager";
import { listComposicoes } from "@/services/composicoes";
import { listMotoristas } from "@/services/motoristas";
import { listVeiculos } from "@/services/veiculos";
import { createClient } from "@/utils/supabase/server";
import { ComposicaoFull } from "@/types";
import { cookies } from "next/headers";

export default async function ComposicoesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [composicoesResult, motoristasResult, veiculosResult] = await Promise.all([
    listComposicoes(supabase),
    listMotoristas(supabase),
    listVeiculos(supabase),
  ]);

  const warning =
    composicoesResult.error ?? motoristasResult.error ?? veiculosResult.error;

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader
          title="Composicoes"
          description="Gerencie composicoes de motorista + cavalo + carreta com engate/desengate e trocas operacionais."
          warning={warning ? `Aviso: ${warning}` : null}
        />

        <ComposicoesManager
          initialComposicoes={composicoesResult.data as ComposicaoFull[]}
          initialMotoristas={motoristasResult.data}
          initialVeiculos={veiculosResult.data}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
