"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "admin" | "operador" | "motorista";
  fallback?: ReactNode;
}

/**
 * Component to protect routes and require authentication
 * Redirects to login if not authenticated
 * Optionally checks for specific role
 */
export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated) {
      router.push("/motorista/login");
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, profile, loading, requiredRole, router]);

  if (loading) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be handled by useEffect redirect
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null; // Will be handled by useEffect redirect
  }

  return <>{children}</>;
}
