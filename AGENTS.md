# LogFlow - Agent & Workflow Configuration

Este arquivo define como agentes de IA devem trabalhar no projeto LogFlow.

## 🤖 Agent Modes

### Default Agent
**Foco**: Implementação de features e correção de bugs
**Escopo**: Trabalha em todo o codebase
**Princípios**:
- Seguir as convenções em `.github/copilot-instructions.md`
- Manter type safety com TypeScript
- Usar componentes React com `"use client"` apenas quando necessário
- Sempre usar imports de `@/lib` e `@/types` com alias

### Frontend Agent
**Foco**: Componentes React, UI/UX, interatividade
**Trabalha em**: `/components/**`, `/app/**`
**Restrições**:
- Não editá arquivos de configuração ou backend
- Manter Tailwind como base (shadcn/ui é opcional)
- Componentes devem ser isolados e reutilizáveis
- Props sempre tipadas

### Backend Agent
**Foco**: Integrações Supabase, APIs, tipos
**Trabalha em**: `/lib/**`, `/types/**`
**Restrições**:
- Não editá componentes React
- Manter configuração Supabase em `lib/supabase.ts`
- Tipos centralizados em `types/index.ts`

## 📋 Convenções a Seguir

### Importação de Módulos
```typescript
// ✅ Correto
import { Load } from "@/types";
import { mockLoads } from "@/lib/mock-data";
import { Sidebar } from "@/components/Sidebar";

// ❌ Evitar
import { Load } from "../../../types";
import { mockLoads } from "../../../../lib/mock-data";
```

### Componentes React
```typescript
// ✅ Structure
"use client"; // Apenas se necessário

import { ReactNode } from "react";
import { SomeIcon } from "lucide-react";
import { Load } from "@/types";

interface ComponentProps {
  data: Load;
  children?: ReactNode;
}

export function Component({ data, children }: ComponentProps) {
  return <div>{children}</div>;
}
```

### Formulários e Validação
```typescript
// Validar sempre inputs
if (!formData.origin || !formData.destination) {
  alert("Preencha todos os campos obrigatórios");
  return;
}
```

## 🔄 Workflow de Desenvolvimento

1. **Antes de fazer changes**
   - Ler `.github/copilot-instructions.md`
   - Verificar tipos em `types/index.ts`
   - Revisar estrutura em `README.md`

2. **Ao criar novo componente**
   - PascalCase filename
   - Props tipadas com interface
   - Usar `"use client"` apenas se necessário
   - Exportar como named export

3. **Ao modificar tipos**
   - Centralizar em `types/index.ts`
   - Documentar interfaces
   - Atualizar imports em componentes que usam

4. **Antes de finalizar**
   - Verificar type errors com `npm run lint`
   - Testar responsividade (mobile + desktop)
   - Remover `console.log` de debug

## 🎯 Próximas Prioridades

1. **Phase 1 - Estrutura Base** ✅
   - Dashboard layout
   - Kanban com mock data
   - Modal para adicionar cargas
   - Componentes base

2. **Phase 2 - Supabase Integration** 🔜
   - Autenticação
   - Tabelas: `loads`, `drivers`, `users`
   - Real-time listeners
   - RLS policies

3. **Phase 3 - Funcionalidades**
   - Drag-and-drop Kanban
   - Filtros e busca
   - Relatórios
   - Integração WhatsApp API

4. **Phase 4 - Otimizações**
   - Server Components
   - Suspense
   - Performance
   - Caching

## 🚫 Anti-patterns

❌ **Não fazer**:
- Usar `any` em TypeScript
- Importar com paths relativos muito longos
- Deixar `console.log()` em produção
- Misturar Server e Client Components sem necessidade
- Espalhar lógica em vários componentes (centralizar em lib/)
- Hardcodar valores (usar `lib/mock-data.ts` ou env vars)

## 📚 Referências Rápidas

| Tarefa | Arquivo | Pattern |
|--------|---------|---------|
| Tipos | `types/index.ts` | `export interface Name { ... }` |
| Dados Mockados | `lib/mock-data.ts` | `export const mock... = [...]` |
| Componente | `components/Name.tsx` | `export function Name() { ... }` |
| Página | `app/route/page.tsx` | `export default function Page() { ... }` |
| Função Utilitária | `lib/utils.ts` | `export function camelCase() { ... }` |

---

**Versão**: 1.0
**Status**: Ativo
**Última atualização**: Abril 2026
