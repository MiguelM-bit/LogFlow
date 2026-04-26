"use client";

import dynamic from "next/dynamic";
import { Bell, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ThemeToggle = dynamic(
  () => import("@/components/layout/ThemeToggle").then((mod) => mod.ThemeToggle),
  { ssr: false }
);

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="relative hidden w-full max-w-md items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[color:var(--color-muted)]" />
          <Input
            placeholder="Buscar carga, cliente ou rota..."
            className="h-10 rounded-xl border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-9"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Notificacoes" className="rounded-xl">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl">
            <Sparkles className="h-4 w-4" />
            Acoes
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            LF
          </div>
        </div>
      </div>
    </header>
  );
}
