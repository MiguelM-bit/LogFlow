import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/data-display/StatCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Activity, Layers2, Route, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const highlightCards = [
    {
      label: "Módulos operacionais",
      value: 6,
      icon: Activity,
      tone: "default" as const,
      hint: "Fluxos críticos conectados",
    },
    {
      label: "Programação",
      value: "SLA Ativo",
      icon: Route,
      tone: "success" as const,
      hint: "Motor de prioridade em execução",
    },
    {
      label: "Composições",
      value: "Em tempo real",
      icon: Layers2,
      tone: "warning" as const,
      hint: "Vínculos monitorados continuamente",
    },
    {
      label: "Cargas",
      value: "Módulo dedicado",
      icon: Truck,
      tone: "danger" as const,
      hint: "CRUD independente em /cargas",
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

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Layers2 className="mt-1 h-5 w-5 text-primary-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Cargas como subsistema</h2>
                <p className="mt-1 text-sm text-slate-600">
                  O fluxo operacional de cargas foi separado do dashboard para evoluir com arquitetura limpa.
                </p>
                <Link href="/cargas" className="mt-3 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700">
                  Abrir módulo de cargas
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Route className="mt-1 h-5 w-5 text-amber-500" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Programação contínua</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Priorização SLA, sugestão de composição e visão em tempo real continuam disponíveis em Programação.
                </p>
                <Link href="/programacao" className="mt-3 inline-flex text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Ir para programação
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Truck className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Composições e frota</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Gestão de ativos, engates e disponibilidade de operação seguem em módulos especializados.
                </p>
                <Link href="/composicoes" className="mt-3 inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Gerenciar composições
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </PageContainer>
    </DashboardLayout>
  );
}
