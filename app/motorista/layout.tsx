"use client";

import { AuthGuard } from "@/components/AuthGuard";

export default function MotoristLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="motorista">
      {children}
    </AuthGuard>
  );
}
