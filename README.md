# LogFlow

Plataforma operacional de logistica (Next.js + Supabase) para gestao de cargas, programacao e cadastros unificados.

## Visao Geral

O projeto usa:

- Next.js (App Router) com TypeScript
- Supabase (Auth, Database, Storage)
- Tailwind CSS e componentes React

O foco atual e manter uma base segura para publicacao no GitHub e deploy no Vercel.

## Funcionalidades

- Dashboard com visao operacional e Kanban de cargas
- Programacao com regras de SLA e priorizacao
- Cadastros unificados (Pessoa Fisica, Pessoa Juridica, Veiculos)
- Gestao de composicoes operacionais
- Modulo de documentos (POD)
- Autenticacao com Supabase Auth e perfis por role

## Stack

- Next.js 16+
- React 19
- TypeScript
- Supabase (@supabase/supabase-js, @supabase/ssr)
- Tailwind CSS

## Setup Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis de ambiente

Crie `.env.local` com base em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Observacoes de seguranca:

- Nunca commitar `.env` ou `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` deve ser usada apenas no backend
- Frontend deve usar apenas `NEXT_PUBLIC_*`

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Aplicacao em `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Configuracao de Ambiente Centralizada

Arquivo: `config/env.ts`

Responsabilidades:

- Centralizar leitura de envs
- Validar envs obrigatorias com erro claro
- Separar uso publico (`NEXT_PUBLIC_*`) e servidor (`SUPABASE_SERVICE_ROLE_KEY`)

Arquivo admin server-only: `utils/supabase/admin.ts`

- Usa `SUPABASE_SERVICE_ROLE_KEY`
- Exclusivo para API routes e server functions

## Seguranca para GitHub

Antes de subir o repositorio:

1. Garanta que `.env*` estao no `.gitignore`
2. Confirme que nenhum token/chave foi hardcoded
3. Mantenha apenas `.env.example` versionado
4. Revise historico de commits para segredos acidentais

Checklist rapido:

- `.env`, `.env.local` ignorados
- Sem `SUPABASE_SERVICE_ROLE_KEY` em componentes client
- Sem URLs/chaves reais no codigo

## Deploy no Vercel

### 1. Conectar repositorio

- Importar projeto no Vercel (Framework: Next.js)

### 2. Configurar variaveis no Vercel

Em Project Settings -> Environment Variables, adicionar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (URL publica do projeto)

### 3. Build

O projeto deve buildar sem depender de caminhos locais.

Comando de verificacao:

```bash
npm run build
```

## Estrutura (Resumo)

```text
app/            rotas e paginas (Next.js App Router)
components/     componentes de UI e fluxo
services/       regras de negocio
hooks/          hooks customizados
types/          tipos TypeScript
config/         configuracao centralizada (env)
utils/supabase/ clientes Supabase (client/server/admin)
db/migrations/  migracoes SQL
```

## Licenca

Uso interno do projeto LogFlow.
