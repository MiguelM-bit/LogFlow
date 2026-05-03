-- Migration: add vehicle assignment to loads closure flow
-- Date: 2026-05-03

alter table if exists public.loads
  add column if not exists vehicle_id uuid null references public.veiculos(id) on delete set null;

create index if not exists idx_loads_vehicle_id on public.loads(vehicle_id);
