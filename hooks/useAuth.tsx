"use client";

import { useEffect, useState, useCallback, useContext, createContext } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthSession, UserProfile } from "@/types";
import * as authService from "@/services/authService";

interface AuthContextType {
  session: AuthSession | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (cpf: string, password: string) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
  resetPassword: (cpf: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  isMotorista: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await authService.getSession(supabase);

        if (result.data) {
          setSession(result.data);
          setProfile(result.data.profile || null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar autenticação";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (authSession?.user) {
        const profileResult = await authService.getUserProfile(supabase, authSession.user.id);
        setSession({
          user: authSession.user,
          profile: profileResult.data || undefined,
        });
        setProfile(profileResult.data || null);
      } else {
        setSession(null);
        setProfile(null);
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(
    async (cpf: string, password: string): Promise<AuthSession | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await authService.signIn(supabase, { cpf, password });

        if (result.error) {
          setError(result.error);
          return null;
        }

        if (result.data) {
          setSession(result.data);
          setProfile(result.data.profile || null);
          return result.data;
        }

        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao fazer login";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signOut(supabase);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSession(null);
      setProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer logout";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (cpf: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.resetPassword(supabase, cpf);

      if (result.error) {
        setError(result.error);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao resetar senha";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = Boolean(session?.user);
  const isAdmin = profile?.role === "admin";
  const isOperador = profile?.role === "operador";
  const isMotorista = profile?.role === "motorista";

  return {
    session,
    profile,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    isAuthenticated,
    isAdmin,
    isOperador,
    isMotorista,
  };
}

// Provider component for app-wide auth context
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Hook to use auth context from other components
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
