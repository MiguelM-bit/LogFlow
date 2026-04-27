import { DashboardLayout } from "@/components/DashboardLayout";
import { formatCurrency, mapDatabaseLoad } from "@/lib/cargas";
import { DatabaseLoad } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { BarChart3, Gauge, Route, Truck, Users } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("cargas").select("*").order("updated_at", { ascending: false });
  const loads = (data ?? []).map((row) => mapDatabaseLoad(row as DatabaseLoad));

  const vehicleStats = Object.entries(
    loads.reduce<Record<string, { count: number; totalFreight: number }>>((acc, load) => {
      const current = acc[load.vehicleType] ?? { count: 0, totalFreight: 0 };
      current.count += 1;
      current.totalFreight += load.freightValue;
      acc[load.vehicleType] = current;
      return acc;
    }, {})
  ).sort((left, right) => right[1].count - left[1].count);

  const routeHotspots = Object.entries(
    loads.reduce<Record<string, number>>((acc, load) => {
      const routeKey = `${load.origin} -> ${load.destination}`;
      acc[routeKey] = (acc[routeKey] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((left, right) => right[1] - left[1]).slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        <section className="rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600">Demanda de frota em tempo real</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Painel de frota
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Enquanto a tabela de motoristas ainda nao existe, este painel usa as cargas reais para mostrar a pressao operacional por tipo de veiculo e rota.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-orange-100">
              <Users className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-slate-700">{vehicleStats.length} perfis de veiculo observados</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicleStats.map(([vehicleType, stats], index) => (
            <article
              key={vehicleType}
              className="hover-lift rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{vehicleType}</h2>
                  <p className="mt-1 text-sm text-slate-500">Demanda atual por perfil de veiculo</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {stats.count} cargas
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-500" />
                  {vehicleType}
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-amber-500" />
                  Ticket acumulado: {formatCurrency(stats.totalFreight)}
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  Participacao na operacao: {loads.length > 0 ? Math.round((stats.count / loads.length) * 100) : 0}%
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <Route className="h-5 w-5 text-sky-500" />
            <h2 className="text-xl font-bold text-slate-900">Rotas mais quentes</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {routeHotspots.map(([route, count]) => (
              <div key={route} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">{route}</p>
                <p className="mt-2 text-sm text-slate-500">{count} carga(s) nessa faixa operacional</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
