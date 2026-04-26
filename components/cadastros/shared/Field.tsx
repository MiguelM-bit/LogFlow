"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FieldOption {
  label: string;
  value: string;
}

interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  onChange: (next: string) => void;
  readOnly: boolean;
  type?: "text" | "date" | "email" | "number" | "password";
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  invalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export function Field({
  label,
  value,
  onChange,
  readOnly,
  type = "text",
  placeholder,
  required = false,
  options,
  invalid = false,
  errorMessage,
  className,
}: FieldProps) {
  const normalizedValue = value ?? "";

  return (
    <label className={cn("space-y-1.5", invalid && "animate-cep-error-shake", className)}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
        {label}
        {required ? " *" : ""}
      </span>
      {options ? (
        <select
          value={String(normalizedValue)}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
          className={cn(
            "h-10 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-foreground)] disabled:opacity-70",
            invalid && "border-red-500 focus-visible:ring-red-500 animate-cep-error-pulse"
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={String(normalizedValue)}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          readOnly={readOnly}
          className={invalid ? "border-red-500 focus-visible:ring-red-500 animate-cep-error-pulse" : undefined}
        />
      )}
      {invalid && errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </label>
  );
}
