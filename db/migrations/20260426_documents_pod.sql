-- Migration: POD documents module
-- Date: 2026-04-26

create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.cargas(id) on delete cascade,
  driver_id uuid not null references public.motoristas(id),
  file_url text not null,
  file_path text not null,
  file_type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_load_id on public.documents(load_id);
create index if not exists idx_documents_driver_id on public.documents(driver_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_created_at on public.documents(created_at desc);

alter table if exists public.documents enable row level security;

-- Motorista: apenas documentos do próprio vínculo (claim customizada driver_id)
drop policy if exists documents_driver_read_own on public.documents;
create policy documents_driver_read_own on public.documents
  for select
  to authenticated
  using (
    coalesce(auth.jwt() ->> 'driver_id', '') = driver_id::text
  );

drop policy if exists documents_driver_insert_own on public.documents;
create policy documents_driver_insert_own on public.documents
  for insert
  to authenticated
  with check (
    coalesce(auth.jwt() ->> 'driver_id', '') = driver_id::text
  );

drop policy if exists documents_driver_update_own on public.documents;
create policy documents_driver_update_own on public.documents
  for update
  to authenticated
  using (
    coalesce(auth.jwt() ->> 'driver_id', '') = driver_id::text
  )
  with check (
    coalesce(auth.jwt() ->> 'driver_id', '') = driver_id::text
  );

-- Usuário interno/admin: acesso total
drop policy if exists documents_internal_all on public.documents;
create policy documents_internal_all on public.documents
  for all
  to authenticated
  using (
    coalesce(auth.jwt() ->> 'role', '') in ('internal', 'admin')
  )
  with check (
    coalesce(auth.jwt() ->> 'role', '') in ('internal', 'admin')
  );

-- Storage bucket (privado)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Driver: objetos dentro da pasta driver_id
-- Caminho esperado: <driver_id>/<load_id>/<timestamp>-arquivo.ext
drop policy if exists storage_documents_driver_read_own on storage.objects;
create policy storage_documents_driver_read_own on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = coalesce(auth.jwt() ->> 'driver_id', '')
  );

drop policy if exists storage_documents_driver_insert_own on storage.objects;
create policy storage_documents_driver_insert_own on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = coalesce(auth.jwt() ->> 'driver_id', '')
  );

drop policy if exists storage_documents_driver_delete_own on storage.objects;
create policy storage_documents_driver_delete_own on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and split_part(name, '/', 1) = coalesce(auth.jwt() ->> 'driver_id', '')
  );

-- Interno/admin: acesso total ao bucket
drop policy if exists storage_documents_internal_all on storage.objects;
create policy storage_documents_internal_all on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'documents'
    and coalesce(auth.jwt() ->> 'role', '') in ('internal', 'admin')
  )
  with check (
    bucket_id = 'documents'
    and coalesce(auth.jwt() ->> 'role', '') in ('internal', 'admin')
  );
