export type DocumentStatus = "pending" | "approved" | "rejected";

export interface DocumentDriver {
  id: string;
  nome: string;
}

export interface DocumentLoad {
  id: string;
  origem: string;
  destino: string;
}

export interface DocumentRecord {
  id: string;
  load_id: string;
  driver_id: string;
  file_url: string;
  file_path: string;
  file_type: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  created_at: string;
  driver?: DocumentDriver | null;
  load?: DocumentLoad | null;
}

export interface CreateDocumentInput {
  load_id: string;
  driver_id: string;
  file_url: string;
  file_path: string;
  file_type: string;
}

export interface UpdateDocumentStatusInput {
  id: string;
  status: DocumentStatus;
  reason?: string | null;
}

export interface DocumentFilters {
  loadId?: string;
  driverId?: string;
  status?: DocumentStatus | "all";
}
