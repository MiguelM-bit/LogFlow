-- Migration: Add cliente, perfil, horario_coleta, horario_descarga to loads table
-- Date: 2026-05-03

ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS perfil text,
  ADD COLUMN IF NOT EXISTS horario_coleta timestamptz,
  ADD COLUMN IF NOT EXISTS horario_descarga timestamptz;

-- Indexes for filter performance
CREATE INDEX IF NOT EXISTS idx_loads_cliente ON public.loads(cliente);
CREATE INDEX IF NOT EXISTS idx_loads_perfil ON public.loads(perfil);
CREATE INDEX IF NOT EXISTS idx_loads_origin ON public.loads(origin);
CREATE INDEX IF NOT EXISTS idx_loads_destination ON public.loads(destination);
CREATE INDEX IF NOT EXISTS idx_loads_horario_coleta ON public.loads(horario_coleta);
