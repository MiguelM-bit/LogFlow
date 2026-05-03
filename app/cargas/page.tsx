import { DashboardLayout } from "@/components/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { listLoads } from "@/app/cargas/services/loadService";
import { CargasPageClient } from "@/app/cargas/components/CargasPageClient";

export const dynamic = "force-dynamic";

export default async function CargasPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const loadsResult = await listLoads(supabase, {});

  return (
    <DashboardLayout>
      <PageContainer>
        <CargasPageClient initialLoads={loadsResult.data} />
      </PageContainer>
    </DashboardLayout>
  );
}
