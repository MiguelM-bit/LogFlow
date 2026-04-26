-- Migration: Unified Cadastros Model (PF, PJ, Veiculos)
-- Date: 2026-04-17
-- Strategy: additive migration, preserve legacy tables and backfill new structures.

create extension if not exists pgcrypto;

create table if not exists cad_enderecos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'Comercial',
  cep text not null default '',
  logradouro text not null default '',
  numero text not null default '',
  complemento text,
  bairro text not null default '',
  municipio text not null default '',
  uf text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cad_rntrc (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  data_emissao date,
  validade date,
  tipo_transportador text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cad_rntrc_numero_unique unique (numero)
);

create table if not exists cad_pessoas_fisicas (
  id uuid primary key default gen_random_uuid(),
  cpf text not null,
  nome text not null,
  data_nascimento date,
  telefone text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'pendente')),
  nacionalidade text,
  naturalidade text,
  grau_instrucao text,
  estado_civil text,
  raca_cor text,
  modalidade text,
  situacao text,
  email text,
  filiacao_pai text,
  filiacao_mae text,
  endereco_id uuid not null references cad_enderecos(id),
  rntrc_id uuid references cad_rntrc(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cad_pessoas_fisicas_cpf_unique unique (cpf)
);

create table if not exists cad_pessoas_fisicas_documentos (
  pessoa_fisica_id uuid primary key references cad_pessoas_fisicas(id) on delete cascade,
  rg_numero text,
  rg_orgao_expedidor text,
  rg_uf text,
  rg_data_emissao date,
  cnh_numero text,
  cnh_registro text,
  cnh_codigo_seguranca text,
  cnh_renach text,
  cnh_data_primeira_habilitacao date,
  cnh_data_emissao date,
  cnh_validade date,
  cnh_uf text,
  cnh_categoria text,
  cnh_orgao_emissor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cad_empresas (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null,
  razao_social text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'pendente')),
  nome_fantasia text,
  cnae text,
  inscricao_estadual text,
  atividade_fiscal text,
  regime_tributario text,
  modalidade text,
  situacao text,
  email text,
  endereco_id uuid not null references cad_enderecos(id),
  rntrc_id uuid references cad_rntrc(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cad_empresas_cnpj_unique unique (cnpj)
);

create table if not exists cad_empresas_telefones (
  empresa_id uuid primary key references cad_empresas(id) on delete cascade,
  tipo text,
  numero text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cad_veiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'pendente')),
  renavam text,
  chassis text,
  ano integer,
  cor text,
  municipio text,
  marca text,
  modelo text,
  agrupamento text,
  classificacao text,
  modalidade text,
  situacao text,
  proprietario_empresa_id uuid references cad_empresas(id),
  proprietario_cnpj_documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cad_veiculos_placa_unique unique (placa)
);

create index if not exists idx_cad_pessoas_fisicas_nome on cad_pessoas_fisicas (nome);
create index if not exists idx_cad_empresas_razao on cad_empresas (razao_social);
create index if not exists idx_cad_veiculos_modelo on cad_veiculos (modelo);

-- Backfill from legacy motoristas table to PF cadastros.
with default_address as (
  insert into cad_enderecos (tipo, cep, logradouro, numero, bairro, municipio, uf)
  values ('Comercial', '', 'Endereco legado', 'S/N', '', '', '')
  returning id
)
insert into cad_pessoas_fisicas (nome, cpf, telefone, status, endereco_id)
select
  m.nome,
  m.cpf,
  m.telefone,
  case when m.status = 'inativo' then 'inativo' else 'ativo' end,
  (select id from default_address)
from motoristas m
where not exists (
  select 1
  from cad_pessoas_fisicas p
  where p.cpf = m.cpf
);

-- Backfill from legacy veiculos table to unified veiculos.
insert into cad_veiculos (placa, status, modelo, classificacao, modalidade, proprietario_cnpj_documento)
select
  upper(v.placa),
  'ativo',
  v.tipo,
  v.categoria,
  null,
  v.proprietario_pj
from veiculos v
where not exists (
  select 1
  from cad_veiculos cv
  where cv.placa = upper(v.placa)
);

-- Integrity helper to validate owner mode.
do $$
declare
  v_rel regclass;
begin
  v_rel := to_regclass('public.cad_veiculos');

  if v_rel is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'cad_veiculos_owner_mode_chk'
         and conrelid = v_rel
     )
  then
    alter table public.cad_veiculos
      add constraint cad_veiculos_owner_mode_chk
      check (
        modalidade is distinct from 'proprietario'
        or proprietario_empresa_id is not null
      );
  end if;
end
$$;

-- RLS baseline policies for cadastro tables.
alter table if exists public.cad_enderecos enable row level security;
alter table if exists public.cad_rntrc enable row level security;
alter table if exists public.cad_pessoas_fisicas enable row level security;
alter table if exists public.cad_pessoas_fisicas_documentos enable row level security;
alter table if exists public.cad_empresas enable row level security;
alter table if exists public.cad_empresas_telefones enable row level security;
alter table if exists public.cad_veiculos enable row level security;

drop policy if exists cad_enderecos_rw on public.cad_enderecos;
create policy cad_enderecos_rw on public.cad_enderecos
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_rntrc_rw on public.cad_rntrc;
create policy cad_rntrc_rw on public.cad_rntrc
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_pessoas_fisicas_rw on public.cad_pessoas_fisicas;
create policy cad_pessoas_fisicas_rw on public.cad_pessoas_fisicas
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_pf_documentos_rw on public.cad_pessoas_fisicas_documentos;
create policy cad_pf_documentos_rw on public.cad_pessoas_fisicas_documentos
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_empresas_rw on public.cad_empresas;
create policy cad_empresas_rw on public.cad_empresas
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_empresas_telefones_rw on public.cad_empresas_telefones;
create policy cad_empresas_telefones_rw on public.cad_empresas_telefones
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cad_veiculos_rw on public.cad_veiculos;
create policy cad_veiculos_rw on public.cad_veiculos
  for all
  to anon, authenticated
  using (true)
  with check (true);
