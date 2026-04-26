"use client";

interface TabItem {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  invalidTabs?: string[];
}

export function TabGroup({ tabs, active, onChange, invalidTabs = [] }: TabGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const isInvalid = invalidTabs.includes(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ease-out ${
              isActive
                ? "bg-slate-800 text-white shadow-sm"
                : isInvalid
                  ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300 hover:bg-rose-200"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
