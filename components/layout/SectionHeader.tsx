import { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  warning?: string | null;
  className?: string;
}

export function SectionHeader({ title, description, actions, warning, className }: SectionHeaderProps) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <CardHeader className="mb-0 p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {warning ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {warning}
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
