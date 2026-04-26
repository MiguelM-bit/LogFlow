# LogFlow - Instruções de Desenvolvimento

Arquivo de instruções personalizadas para o desenvolvimento do SaaS LogFlow.

## 📋 Convenções do Projeto

### Estrutura de Pastas
- `/app` - Next.js App Router (layouts, páginas)
- `/components` - Componentes React reutilizáveis
- `/lib` - Utilidades, helpers, configurações (Supabase, mock data)
- `/types` - Definições TypeScript centralizadas
- `/public` - Ativos estáticos

### Nomenclatura
- **Componentes**: PascalCase (ex: `LoadCard.tsx`)
- **Páginas**: kebab-case em pastas (ex: `/app/load-details/page.tsx`)
- **Funções utilitárias**: camelCase (ex: `organizeLoadsByStatus`)
- **Tipos**: PascalCase (ex: `Load`, `LoadStatus`)

## 🧠 Princípios Arquiteturais

1. **Server Components por padrão**
   - Use Client Components apenas para interatividade (forms, modais, estados dinâmicos)
   - Marque com `"use client"` apenas onde necessário

2. **Dados Mockados → Supabase**
   - Atualmente: `lib/mock-data.ts` fornece dados iniciais
   - Próximo passo: Substituir por queries de Supabase em useEffect/Server Components

3. **Tailwind CSS First**
   - Componentes sem dependências externas de UI
   - Adicionar shadcn/ui gradualmente se necessário
   - Manter consistência de cores/espaçamento via tailwind.config.ts

4. **Type Safety**
   - Todos os componentes precisam de props tipadas
   - Usar interfaces do `types/index.ts`
   - Evitar `any`

## 🔧 Comandos Úteis

```bash
npm run dev        # Iniciar servidor de desenvolvimento
npm run build      # Build para produção
npm run start      # Iniciar servidor de produção
npm run lint       # Verificar linting
```

## 📝 Padrões de Código

### Componente React Básico
```typescript
"use client";

import { SomeIcon } from "lucide-react";
import { useState } from "react";

interface ComponentProps {
  // Props tipadas
}

export function Component({ }: ComponentProps) {
  const [state, setState] = useState();

  return (
    <div className="space-y-4">
      {/* JSX aqui */}
    </div>
  );
}
```

### Usando Dados Mockados
```typescript
import { mockLoads, organizeLoadsByStatus } from "@/lib/mock-data";

useEffect(() => {
  const organized = organizeLoadsByStatus(mockLoads);
  // usar dados
}, []);
```

### Adicionando Novo Tipo
1. Editar `types/index.ts`
2. Exportar interface/type
3. Importar em componentes com `import { Type } from "@/types"`

## 🚨 Pontos de Atenção

- **Supabase**: Variáveis de ambiente em `.env.local` (não commitar!)
- **Re-renders**: Memoize callbacks com useCallback se necessário
- **Responsividade**: Testar em mobile (use classes lg: para desktop)
- **Performance**: Lazy load componentes grandes com React.lazy()

## 🔐 Segurança

- Não expor chaves privadas Supabase (usar ANON KEY apenas)
- Validar inputs em formulários
- Usar RLS (Row Level Security) em Supabase para dados sensíveis

## 📚 Documentação Relacionada

- [README.md](./README.md) - Visão geral do projeto
- [.env.local.example](./.env.local.example) - Template de variáveis
- [tailwind.config.ts](./tailwind.config.ts) - Tema e cores

## 🎯 Focus Areas

Este SaaS é focado em:
1. **Produtividade** - Interface rápida e intuitiva
2. **Responsividade** - Funciona em qualquer dispositivo
3. **Mobilidade** - Profissionais logísticos em movimento
4. **Integração** - WhatsApp, Supabase pronto

---

**Última atualização**: Abril 2026
**Status**: Em desenvolvimento 🚀
