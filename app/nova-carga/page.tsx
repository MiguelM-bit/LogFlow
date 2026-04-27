import { DashboardLayout } from "@/components/DashboardLayout";
import { AddLoadForm } from "@/components/AddLoadForm";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { mapDatabaseLoad, summarizeLoads, formatCurrency } from "@/lib/cargas";
import { DatabaseLoad } from "@/types";
import { TrendingUp, Package, DollarSign, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NovaCargarPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("cargas").select("*");
  const loads = (data ?? []).map((row) => mapDatabaseLoad(row as DatabaseLoad));
  const summary = summarizeLoads(loads);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Cadastro de operação
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Nova carga
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Preencha os dados abaixo para registrar uma carga. Ela aparecerá automaticamente no
                  Kanban assim que for salva.
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 text-center">
                <Package className="mx-auto h-5 w-5 text-violet-400 mb-1" />
                <p className="text-2xl font-bold text-slate-900">{summary.totalLoads}</p>
                <p className="text-xs text-slate-500 mt-0.5">Cargas</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-emerald-400 mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{summary.availableCount + summary.negotiatingCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Em aberto</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 text-center">
                <DollarSign className="mx-auto h-5 w-5 text-amber-400 mb-1" />
                <p className="text-lg font-bold text-amber-600">{formatCurrency(summary.averageFreight)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Ticket médio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <AddLoadForm />
      </div>
    </DashboardLayout>
  );
}
