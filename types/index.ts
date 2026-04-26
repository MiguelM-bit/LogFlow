export * from "./document.types";
export * from "./user.types";

export type LoadStatus = "available" | "negotiating" | "scheduled" | "completed";

export type SLAPrioridade = "critico" | "alerta" | "ok";

export type DatabaseLoadStatus =
  | "disponivel"
  | "negociando"
  | "programada"
  | "concluida";

export interface DatabaseLoad {
  id: string;
  cliente: string | null;
  origem: string;
  destino: string;
  horario_coleta: string | null;
  composicao_id: string | null;
  tipo_veiculo: string;
  valor_frete: number | null;
  status: DatabaseLoadStatus | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Load {
  id: string;
  client?: string;
  origin: string;
  destination: string;
  pickupAt?: string | null;
  compositionId?: string | null;
  vehicleType: string;
  freightValue: number;
  status: LoadStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type KanbanData = Record<LoadStatus, Load[]>;

export type ProgramacaoStatus = "programada" | "pendente" | "atrasado";

export type MotoristaStatus = "ativo" | "inativo";

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status: MotoristaStatus;
}

export type CategoriaVeiculo = "Trator" | "Reboque";

export interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  categoria: CategoriaVeiculo;
  proprietario_pj: string | null;
}

export interface Composicao {
  id: string;
  motorista_id: string;
  cavalo_id: string;
  carreta_id: string;
  ativo: boolean;
  motorista?: Pick<Motorista, "id" | "nome" | "telefone"> | null;
  cavalo?: Pick<Veiculo, "id" | "placa" | "categoria"> | null;
  carreta?: Pick<Veiculo, "id" | "placa" | "categoria"> | null;
}

export interface ComposicaoFull extends Composicao {
  data_engate: string | null;
  local_engate: string | null;
  data_desengate: string | null;
  local_desengate: string | null;
}

export interface HistoricoComposicao {
  id: string;
  composicao_id: string;
  motorista_id: string | null;
  cavalo_id: string | null;
  carreta_id: string | null;
  evento: "engate" | "desengate" | "troca_motorista" | "troca_veiculo";
  local: string | null;
  observacao: string | null;
  created_at: string;
}

export interface ProgramacaoCarga {
  id: string;
  cliente: string;
  origem: string;
  destino: string;
  horario_coleta: string | null;
  empresa_vinc: string | null;
  status_viagem: DatabaseLoadStatus | null;
  status_operacional: ProgramacaoStatus;
  composicao_id: string | null;
  motorista_composicao: string;
  urgente: boolean;
}

export interface ProgramacaoCargaComSLA extends ProgramacaoCarga {
  prioridade: SLAPrioridade;
}

export type JanelaHorarioFiltro = "2h" | "4h" | "hoje" | "todos";

export interface SumarioExecutivo {
  totalCritico: number;
  aguardandoMotorista: number;
  emTransito: number;
  totalCargas: number;
}

export interface ProgramacaoFiltros {
  semMotorista: boolean;
  janelaHorario: JanelaHorarioFiltro;
  busca: string;
}

export interface ProgramacaoFiltrosComSLA extends ProgramacaoFiltros {
  prioridade: SLAPrioridade | "todos";
  somenteCriticos: boolean;
  cliente: string;
}

export type CadastroStatus = "ativo" | "inativo" | "pendente";

export interface CadastroEndereco {
  tipo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  municipio: string;
  uf: string;
}

export interface CadastroRntrc {
  numero: string;
  data_emissao: string | null;
  validade: string | null;
  tipo_transportador: string;
}

export interface PessoaFisica {
  id: string;
  cpf: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  status: CadastroStatus;
  nacionalidade: string | null;
  naturalidade: string | null;
  grau_instrucao: string | null;
  estado_civil: string | null;
  raca_cor: string | null;
  rg_numero: string | null;
  rg_orgao_expedidor: string | null;
  rg_uf: string | null;
  rg_data_emissao: string | null;
  cnh_numero: string | null;
  cnh_registro: string | null;
  cnh_codigo_seguranca: string | null;
  cnh_renach: string | null;
  cnh_data_primeira_habilitacao: string | null;
  cnh_data_emissao: string | null;
  cnh_validade: string | null;
  cnh_uf: string | null;
  cnh_categoria: string | null;
  cnh_orgao_emissor: string | null;
  modalidade: string | null;
  situacao: string | null;
  email: string | null;
  filiacao_pai: string | null;
  filiacao_mae: string | null;
  endereco: CadastroEndereco;
  rntrc: CadastroRntrc | null;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
  status: CadastroStatus;
  nome_fantasia: string | null;
  cnae: string | null;
  inscricao_estadual: string | null;
  atividade_fiscal: string | null;
  regime_tributario: string | null;
  modalidade: string | null;
  situacao: string | null;
  email: string | null;
  endereco: CadastroEndereco;
  rntrc: CadastroRntrc | null;
  telefone_tipo: string | null;
  telefone_numero: string | null;
}

export interface VeiculoCadastro {
  id: string;
  placa: string;
  status: CadastroStatus;
  renavam: string | null;
  chassis: string | null;
  ano: number | null;
  cor: string | null;
  municipio: string | null;
  marca: string | null;
  modelo: string | null;
  agrupamento: string | null;
  classificacao: string | null;
  modalidade: string | null;
  situacao: string | null;
  proprietario_empresa_id: string | null;
  proprietario_cnpj_documento: string | null;
}

export interface CadastroSearchItem {
  id: string;
  chave: string;
  titulo: string;
  subtitulo: string | null;
  status: CadastroStatus;
}

export type PessoaFisicaPayload = Omit<PessoaFisica, "id">;

export type EmpresaPayload = Omit<Empresa, "id">;

export type VeiculoCadastroPayload = Omit<VeiculoCadastro, "id">;
