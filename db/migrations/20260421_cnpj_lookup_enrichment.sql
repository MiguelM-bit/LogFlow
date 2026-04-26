-- Migration: CNPJ lookup enrichment and defensive uniqueness
-- Date: 2026-04-21

-- Ensure empresa columns used by CNPJ lookup integration exist.
alter table if exists public.cad_empresas
  add column if not exists nome_fantasia text,
  add column if not exists cnae text,
  add column if not exists atividade_fiscal text,
  add column if not exists regime_tributario text,
  add column if not exists email text;

-- Ensure endereco fields used by lookup mapping exist.
alter table if exists public.cad_enderecos
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists municipio text,
  add column if not exists uf text;

-- Ensure telefone fields exist for persisted phone from API.
alter table if exists public.cad_empresas_telefones
  add column if not exists tipo text,
  add column if not exists numero text;

-- Normalize CNPJ values to digits-only before uniqueness constraint.
update public.cad_empresas
set cnpj = regexp_replace(cnpj, '\\D', '', 'g')
where cnpj is not null;

-- Defensive unique constraint for environments without previous migration.
do $$
begin
  if to_regclass('public.cad_empresas') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'cad_empresas_cnpj_unique'
         and conrelid = 'public.cad_empresas'::regclass
     )
  then
    alter table public.cad_empresas
      add constraint cad_empresas_cnpj_unique unique (cnpj);
  end if;
end
$$;
