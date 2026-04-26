"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

export function DashboardLayout({ children, hideHeader = false }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[color:var(--color-background)]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        {!hideHeader ? <AppHeader /> : null}

        <main className="flex-1 overflow-auto">
          <div className="mx-auto min-h-full w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[color:var(--color-muted)]">
            © 2026 LogFlow • Plataforma operacional conectada ao Supabase
          </p>
        </footer>
      </div>
    </div>
  );
}
