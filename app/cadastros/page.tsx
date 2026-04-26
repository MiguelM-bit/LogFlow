import { DashboardLayout } from "@/components/DashboardLayout";
import { CadastrosHub } from "@/components/cadastros/CadastrosHub";
import { PageContainer } from "@/components/layout/PageContainer";
import { listEmpresasForOwnerSelect } from "@/services/veiculos";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface CadastrosPageProps {
  searchParams?: Promise<{ modulo?: string }>;
}

function normalizeModulo(value: string | undefined) {
  if (value === "pj" || value === "veiculo" || value === "pf") {
    return value;
  }
  return "pf" as const;
}

export default async function CadastrosPage({ searchParams }: CadastrosPageProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const params = searchParams ? await searchParams : undefined;

  const empresasResult = await listEmpresasForOwnerSelect(supabase);

  return (
    <DashboardLayout>
      <PageContainer>
        <CadastrosHub
          initialModule={normalizeModulo(params?.modulo)}
          initialEmpresas={empresasResult.data}
          initialWarning={empresasResult.error}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
