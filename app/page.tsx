import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/data-display/StatCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, mapDatabaseLoad, summarizeLoads } from "@/lib/cargas";
import { DatabaseLoad } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { Activity, CircleDollarSign, PackageCheck, TimerReset } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("cargas").select("*").order("updated_at", { ascending: false });
  const loads = (data ?? []).map((row) => mapDatabaseLoad(row as DatabaseLoad));
  const summary = summarizeLoads(loads);

  const highlightCards = [
    {
      label: "Cargas ativas",
      value: summary.availableCount + summary.negotiatingCount + summary.scheduledCount,
      icon: Activity,
      tone: "default" as const,
      hint: "Disponivel + negociando + programada",
    },
    {
      label: "Frete total",
      value: formatCurrency(summary.totalFreight),
      icon: CircleDollarSign,
      tone: "success" as const,
      hint: "Volume financeiro da operação",
    },
    {
      label: "Concluidas",
      value: summary.completedCount,
      icon: PackageCheck,
      tone: "warning" as const,
      hint: "Cargas encerradas no ciclo",
    },
    {
      label: "Ticket medio",
      value: formatCurrency(summary.averageFreight),
      icon: TimerReset,
      tone: "danger" as const,
      hint: "Frete medio por carga",
    },
  ];

  return (
    <DashboardLayout>
      <PageContainer>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlightCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              hint={card.hint}
            />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponivel</p>
            <p className="mt-2 text-3xl font-semibold text-primary-600">{summary.availableCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Negociando</p>
            <p className="mt-2 text-3xl font-semibold text-amber-500">{summary.negotiatingCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Programada</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-500">{summary.scheduledCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concluida</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-500">{summary.completedCount}</p>
          </Card>
        </section>

        <Card className="p-4 sm:p-6">
          <CardHeader className="mb-5 p-0">
            <CardTitle className="text-base">Pipeline operacional</CardTitle>
            <CardDescription>Visão dinâmica das cargas por estágio da jornada.</CardDescription>
          </CardHeader>
          <KanbanBoard initialLoads={loads} />
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
