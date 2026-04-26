-- Migration: Authentication & Authorization System
-- Date: 2026-04-26
-- Purpose: Add profiles table linking auth.users to cad_pessoas_fisicas with role-based access control

-- Create enum for user roles
create type user_role as enum ('admin', 'operador', 'motorista');

-- Create profiles table (links auth.users to pessoa_fisica)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  person_id uuid not null references cad_pessoas_fisicas(id) on delete cascade,
  name text not null,
  cpf text not null,
  role user_role not null default 'motorista',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_cpf_unique unique (cpf),
  constraint profiles_person_id_unique unique (person_id)
);

-- Create indexes for better performance
create index if not exists idx_profiles_cpf on profiles (cpf);
create index if not exists idx_profiles_person_id on profiles (person_id);
create index if not exists idx_profiles_role on profiles (role);
create index if not exists idx_profiles_created_at on profiles (created_at);

-- Enable RLS on profiles table
alter table profiles enable row level security;

-- RLS Policy: Users can see their own profile
create policy "Users can view own profile"
  on profiles
  for select
  using (auth.uid() = id);

-- RLS Policy: Admin and operador can see all profiles
create policy "Admins and operadores can view all profiles"
  on profiles
  for select
  using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'operador')
    )
  );

-- RLS Policy: Only admin can update roles
create policy "Only admin can update profiles"
  on profiles
  for update
  using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- RLS Policy: Only admin can delete profiles
create policy "Only admin can delete profiles"
  on profiles
  for delete
  using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Grant permissions to authenticated users
grant select on profiles to authenticated;
grant update (name, role) on profiles to authenticated;

-- Add comment for documentation
comment on table profiles is 'Links auth.users to cad_pessoas_fisicas with role-based access control';
comment on column profiles.id is 'Foreign key to auth.users.id';
comment on column profiles.person_id is 'Foreign key to cad_pessoas_fisicas.id';
comment on column profiles.role is 'User role for access control: admin, operador, motorista';
