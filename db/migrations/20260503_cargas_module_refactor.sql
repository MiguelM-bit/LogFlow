-- Migration: Cargas Module Refactor (Clean Architecture baseline)
-- Date: 2026-05-03
-- Goals:
-- 1) Create canonical loads table with explicit status enum
-- 2) Support driver pre-registration on load closing
-- 3) Backfill data from legacy cargas table

create extension if not exists pgcrypto;

-- 1) Status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'load_status'
  ) THEN
    CREATE TYPE load_status AS ENUM (
      'em_aberto',
      'em_negociacao',
      'fechada',
      'cancelada'
    );
  END IF;
END
$$;

-- 2) Evolve motoristas for pre-registration support
ALTER TABLE IF EXISTS public.motoristas
  ADD COLUMN IF NOT EXISTS is_pre_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS incomplete_profile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Guarantee CPF uniqueness for pre-registration lookup consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'motoristas_cpf_unique'
      AND conrelid = 'public.motoristas'::regclass
  ) THEN
    ALTER TABLE public.motoristas
      ADD CONSTRAINT motoristas_cpf_unique UNIQUE (cpf);
  END IF;
END
$$;

-- 3) Canonical loads table
CREATE TABLE IF NOT EXISTS public.loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status load_status NOT NULL DEFAULT 'em_aberto',
  origin text NOT NULL,
  destination text NOT NULL,
  price numeric(14,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  driver_id uuid NULL REFERENCES public.motoristas(id) ON DELETE SET NULL,
  CONSTRAINT loads_origin_not_blank CHECK (length(trim(origin)) > 0),
  CONSTRAINT loads_destination_not_blank CHECK (length(trim(destination)) > 0)
);

-- Additional status check (defensive, even with enum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'loads_status_check'
      AND conrelid = 'public.loads'::regclass
  ) THEN
    ALTER TABLE public.loads
      ADD CONSTRAINT loads_status_check CHECK (
        status IN ('em_aberto', 'em_negociacao', 'fechada', 'cancelada')
      );
  END IF;
END
$$;

-- Indexes for operational listing/filtering
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_created_at_desc ON public.loads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loads_updated_at_desc ON public.loads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON public.loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_origin ON public.loads(origin);
CREATE INDEX IF NOT EXISTS idx_loads_destination ON public.loads(destination);

-- 4) Optional FK from created_by to profiles if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'loads_created_by_fkey'
        AND conrelid = 'public.loads'::regclass
    ) THEN
      ALTER TABLE public.loads
        ADD CONSTRAINT loads_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- 5) Data migration from legacy cargas -> loads (id-preserving)
-- Mapping strategy:
-- disponivel -> em_aberto
-- negociando -> em_negociacao
-- programada -> em_aberto
-- concluida -> fechada
INSERT INTO public.loads (
  id,
  status,
  origin,
  destination,
  price,
  created_at,
  updated_at,
  driver_id
)
SELECT
  c.id,
  CASE
    WHEN c.status = 'negociando' THEN 'em_negociacao'::load_status
    WHEN c.status = 'concluida' THEN 'fechada'::load_status
    WHEN c.status = 'programada' THEN 'em_aberto'::load_status
    ELSE 'em_aberto'::load_status
  END AS status,
  c.origem,
  c.destino,
  COALESCE(c.valor_frete, 0),
  c.created_at,
  c.updated_at,
  NULL::uuid
FROM public.cargas c
ON CONFLICT (id) DO NOTHING;

-- 6) Trigger-friendly updated_at default alignment for future updates
CREATE OR REPLACE FUNCTION public.set_loads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loads_set_updated_at ON public.loads;
CREATE TRIGGER trg_loads_set_updated_at
BEFORE UPDATE ON public.loads
FOR EACH ROW
EXECUTE FUNCTION public.set_loads_updated_at();
