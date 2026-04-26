"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  CalendarClock,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ClipboardPlus,
  FileCheck2,
} from "lucide-react";
import { Link2 } from "lucide-react";
import { useState } from "react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Programacao", href: "/programacao", icon: CalendarClock },
  { label: "Composicoes", href: "/composicoes", icon: Link2 },
  { label: "Cargas", href: "/tasks", icon: Package },
  { label: "Nova carga", href: "/nova-carga", icon: ClipboardPlus },
  { label: "Documentos", href: "/documentos", icon: FileCheck2 },
  { label: "Cadastros", href: "/cadastros", icon: Users },
  { label: "Frota", href: "/veiculos", icon: Truck },
  { label: "Controle", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-40 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all duration-200 hover:shadow md:top-5 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menu"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-slate-900" />
        ) : (
          <Menu className="h-5 w-5 text-slate-900" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-64 transform border-r border-white/10 bg-[color:var(--color-sidebar)] text-[color:var(--color-sidebar-foreground)] transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 font-bold text-white">
                LF
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-wide">LogFlow</h1>
                <p className="text-xs text-slate-400">Transportation OS</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 p-2 text-xs text-slate-300">
              <Search className="h-3.5 w-3.5" />
              <span>Conectado ao Supabase</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-white"}`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary-500" />
                    )}
                  </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-all duration-200 ease-out hover:bg-white/10 hover:text-white">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
