import { DatabaseLoad, DatabaseLoadStatus, KanbanData, Load, LoadStatus } from "@/types";

const databaseToUiStatus: Record<DatabaseLoadStatus, LoadStatus> = {
  disponivel: "available",
  negociando: "negotiating",
  programada: "scheduled",
  concluida: "completed",
};

const uiStatusLabels: Record<LoadStatus, string> = {
  available: "Disponivel",
  negotiating: "Negociando",
  scheduled: "Programada",
  completed: "Concluida",
};

const uiToDatabaseStatus: Record<LoadStatus, DatabaseLoadStatus> = {
  available: "disponivel",
  negotiating: "negociando",
  scheduled: "programada",
  completed: "concluida",
};

export function mapDatabaseLoad(row: DatabaseLoad): Load {
  const normalizedStatus = row.status ?? "disponivel";

  return {
    id: row.id,
    client: row.cliente ?? undefined,
    origin: row.origem,
    destination: row.destino,
    pickupAt: row.horario_coleta,
    compositionId: row.composicao_id,
    vehicleType: row.tipo_veiculo,
    freightValue: Number(row.valor_frete ?? 0),
    status: databaseToUiStatus[normalizedStatus],
    description: row.observacoes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function organizeLoadsByStatus(loads: Load[]): KanbanData {
  const organized: KanbanData = {
    available: [],
    negotiating: [],
    scheduled: [],
    completed: [],
  };

  loads.forEach((load) => {
    organized[load.status].push(load);
  });

  return organized;
}

export function formatLoadStatus(status: LoadStatus): string {
  return uiStatusLabels[status];
}

export function mapUiStatusToDatabase(status: LoadStatus): DatabaseLoadStatus {
  return uiToDatabaseStatus[status];
}

export function summarizeLoads(loads: Load[]) {
  const totalFreight = loads.reduce((acc, load) => acc + load.freightValue, 0);
  const totalLoads = loads.length;
  const countsByStatus = organizeLoadsByStatus(loads);

  return {
    totalLoads,
    totalFreight,
    averageFreight: totalLoads > 0 ? totalFreight / totalLoads : 0,
    availableCount: countsByStatus.available.length,
    negotiatingCount: countsByStatus.negotiating.length,
    scheduledCount: countsByStatus.scheduled.length,
    completedCount: countsByStatus.completed.length,
    lastUpdatedAt: loads[0]?.updatedAt ?? null,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}