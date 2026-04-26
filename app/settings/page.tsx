import { DashboardLayout } from "@/components/DashboardLayout";
import { formatCurrency, mapDatabaseLoad, summarizeLoads } from "@/lib/cargas";
import { DatabaseLoad } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { getPublicEnv } from "@/config/env";
import { Activity, Bell, Database, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const env = getPublicEnv();
  const { data } = await supabase.from("cargas").select("*").order("updated_at", { ascending: false });
  const loads = (data ?? []).map((row) => mapDatabaseLoad(row as DatabaseLoad));
  const summary = summarizeLoads(loads);

  const settingsCards = [
    {
      title: "Conexao de dados",
      description: `Supabase ativo com ${summary.totalLoads} carga(s) lida(s) em tempo real.`,
      icon: Database,
      tone: "from-sky-500 to-cyan-500",
    },
    {
      title: "Saude operacional",
      description: `${summary.availableCount + summary.negotiatingCount + summary.scheduledCount} carga(s) em fluxo e ${summary.completedCount} concluida(s).`,
      icon: Activity,
      tone: "from-violet-500 to-fuchsia-500",
    },
    {
      title: "Seguranca",
      description: `Credenciais publicas carregadas: ${env.NEXT_PUBLIC_SUPABASE_URL ? "sim" : "nao"}.`,
      icon: ShieldCheck,
      tone: "from-emerald-500 to-teal-500",
    },
    {
      title: "Notificacoes",
      description: `Base pronta para disparos operacionais com ticket medio de ${formatCurrency(summary.averageFreight)}.`,
      icon: Bell,
      tone: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-slate-500">Configuracoes da plataforma</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Centro de controle
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Ajuste os pilares do produto sem perder clareza visual nem ritmo operacional.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {settingsCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="hover-lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br p-3 text-white shadow ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volume total</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalLoads}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frete consolidado</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(summary.totalFreight)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultima atualizacao</p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {summary.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString("pt-BR") : "Sem dados"}
            </p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
