"use client";

import { StatCard } from "@/components/data-display/StatCard";
import { SumarioExecutivo as SumarioData } from "@/types";
import { AlertTriangle, Clock, Truck, Package } from "lucide-react";

interface SumarioExecutivoProps {
  sumario: SumarioData;
}

type StatTone = "default" | "success" | "warning" | "danger";

export function SumarioExecutivo({ sumario }: SumarioExecutivoProps) {
  const cards = [
    {
      label: "Críticos",
      value: sumario.totalCritico,
      icon: AlertTriangle,
      tone: (sumario.totalCritico > 0 ? "danger" : "default") as StatTone,
      desc: "SLA próximo do vencimento",
    },
    {
      label: "Aguardando motorista",
      value: sumario.aguardandoMotorista,
      icon: Clock,
      tone: (sumario.aguardandoMotorista > 0 ? "warning" : "default") as StatTone,
      desc: "Sem composição atribuída",
    },
    {
      label: "Em trânsito",
      value: sumario.emTransito,
      icon: Truck,
      tone: "success" as StatTone,
      desc: "Programadas e em curso",
    },
    {
      label: "Total de cargas",
      value: sumario.totalCargas,
      icon: Package,
      tone: "default" as StatTone,
      desc: "Ativas no sistema",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
          hint={card.desc}
        />
      ))}
    </div>
  );
}
