import { cookies } from "next/headers";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { DocumentList } from "@/components/document/DocumentList";
import { createClient } from "@/utils/supabase/server";
import {
  listDocumentDrivers,
  listDocumentLoads,
  listDocuments,
} from "@/services/documentService";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [documentsResult, loadsResult, driversResult] = await Promise.all([
    listDocuments(supabase),
    listDocumentLoads(supabase),
    listDocumentDrivers(supabase),
  ]);

  const warning =
    documentsResult.error ?? loadsResult.error ?? driversResult.error;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Documentação de viagens</h1>
          <p className="text-sm text-slate-600">
            Gestão de comprovantes de entrega (POD), com validação operacional e trilha de auditoria.
          </p>
        </div>

        {warning && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Aviso de integração: {warning}
          </p>
        )}

        <DocumentList
          initialDocuments={documentsResult.data}
          loads={loadsResult.data}
          drivers={driversResult.data}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
