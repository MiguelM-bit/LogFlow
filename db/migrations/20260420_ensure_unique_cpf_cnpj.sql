-- Migration: Ensure unique CPF/CNPJ constraints on cadastro tables
-- Date: 2026-04-20

-- Defensive migration for environments created before unified migration.
do $$
begin
  if to_regclass('public.cad_pessoas_fisicas') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'cad_pessoas_fisicas_cpf_unique'
         and conrelid = 'public.cad_pessoas_fisicas'::regclass
     )
  then
    alter table public.cad_pessoas_fisicas
      add constraint cad_pessoas_fisicas_cpf_unique unique (cpf);
  end if;

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
