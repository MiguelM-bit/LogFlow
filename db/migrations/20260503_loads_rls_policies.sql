-- Migration: RLS policies for loads table
-- Date: 2026-05-03
-- Purpose: Allow authenticated users to read/insert/update loads safely

-- Ensure row level security is enabled
alter table if exists public.loads enable row level security;

-- Ensure table privileges for authenticated role (defensive)
grant select, insert, update on table public.loads to authenticated;

-- Ensure created_by is auto-filled from authenticated user when omitted
create or replace function public.set_loads_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_loads_set_created_by on public.loads;
create trigger trg_loads_set_created_by
before insert on public.loads
for each row
execute function public.set_loads_created_by();

-- SELECT policy: authenticated users can read loads
-- (if you need stricter isolation by owner, change using clause later)
drop policy if exists loads_select_authenticated on public.loads;
create policy loads_select_authenticated
  on public.loads
  for select
  to authenticated
  using (true);

-- Temporary SELECT policy for anon while auth is not enforced on all pages
drop policy if exists loads_select_anon on public.loads;
create policy loads_select_anon
  on public.loads
  for select
  to anon
  using (true);

-- INSERT policy: authenticated users can insert rows for themselves
drop policy if exists loads_insert_authenticated on public.loads;
create policy loads_insert_authenticated
  on public.loads
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or (
      created_by is null
      and auth.uid() is not null
    )
  );

-- Temporary INSERT policy for anon while auth is not enforced on all pages
drop policy if exists loads_insert_anon on public.loads;
create policy loads_insert_anon
  on public.loads
  for insert
  to anon
  with check (true);

-- UPDATE policy: owner or operational roles can update
-- Operational roles are read from JWT claim "role"
drop policy if exists loads_update_owner_or_ops on public.loads;
create policy loads_update_owner_or_ops
  on public.loads
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or coalesce(auth.jwt() ->> 'role', '') in ('admin', 'operador', 'internal')
  )
  with check (
    created_by = auth.uid()
    or coalesce(auth.jwt() ->> 'role', '') in ('admin', 'operador', 'internal')
  );

-- Temporary UPDATE policy for anon while auth is not enforced on all pages
drop policy if exists loads_update_anon on public.loads;
create policy loads_update_anon
  on public.loads
  for update
  to anon
  using (true)
  with check (true);
