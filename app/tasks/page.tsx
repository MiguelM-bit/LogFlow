import { DashboardLayout } from "@/components/DashboardLayout";
import { formatCurrency, formatLoadStatus, mapDatabaseLoad, summarizeLoads } from "@/lib/cargas";
import { DatabaseLoad, Load } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { ArrowRight, ClipboardList, MapPinned, Sparkles, Truck } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("cargas").select("*").order("updated_at", { ascending: false });
  const loads = (data ?? []).map((row) => mapDatabaseLoad(row as DatabaseLoad));
  const summary = summarizeLoads(loads);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Central de execucao
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Fila de cargas
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Visao detalhada das cargas em operacao, com rota, veiculo, valor e status vindos direto da tabela `cargas`.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalLoads}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Frete total</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{formatCurrency(summary.totalFreight)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {loads.map((load: Load, index: number) => (
            <article
              key={load.id}
              className="hover-lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              style={{ animation: `fadeIn 0.4s ease-out ${index * 0.04}s both` }}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {formatLoadStatus(load.status)}
                </span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(load.freightValue)}</span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-500">Rota</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{load.origin}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <ArrowRight className="h-4 w-4" />
                      <span>{load.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <Truck className="h-4 w-4 text-slate-400" />
                  <span>{load.vehicleType}</span>
                </div>

                {load.description && (
                  <p className="text-sm leading-6 text-slate-600">{load.description}</p>
                )}
              </div>
            </article>
          ))}

          {loads.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500 lg:col-span-2 xl:col-span-3">
              <ClipboardList className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              Nenhuma carga encontrada na base.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
