import { cookies } from "next/headers";
import { DriverDocumentUploader } from "@/components/upload/DriverDocumentUploader";
import {
  listDocumentDrivers,
  listDocumentLoads,
} from "@/services/documentService";
import { createClient } from "@/utils/supabase/server";

export default async function MotoristaDocumentosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [loadsResult, driversResult] = await Promise.all([
    listDocumentLoads(supabase),
    listDocumentDrivers(supabase),
  ]);

  const warning = loadsResult.error ?? driversResult.error;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-4 py-5">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center">
        <div className="w-full space-y-4">

          {warning && (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Aviso: {warning}
          </p>
        )}

          <DriverDocumentUploader loads={loadsResult.data} drivers={driversResult.data} />
        </div>
      </div>
    </main>
  );
}
