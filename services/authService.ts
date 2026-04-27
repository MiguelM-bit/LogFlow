import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceResult } from "./types";
import type { SignInPayload, AuthSession, UserProfile } from "@/types/user.types";
import { normalizeDocument } from "./validators";
import { getPublicEnv } from "@/config/env";

/**
 * Sign in user with CPF and password
 * Uses CPF as email identifier in Supabase Auth
 */
export async function signIn(
  supabase: SupabaseClient,
  payload: SignInPayload
): Promise<ServiceResult<AuthSession | null>> {
  const normalizedCpf = normalizeDocument(payload.cpf);

  try {
    // Use CPF as email identifier (CPF@logflow.local)
    const email = `${normalizedCpf}@logflow.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    });

    if (error) {
      return {
        data: null,
        error: error.message || "Falha ao fazer login",
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: "Usuário não encontrado",
      };
    }

    // Fetch user profile
    const profileResult = await getUserProfile(supabase, data.user.id);
    if (profileResult.error) {
      return {
        data: null,
        error: profileResult.error,
      };
    }

    return {
      data: {
        user: data.user,
        profile: profileResult.data || undefined,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao fazer login";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(supabase: SupabaseClient): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: error.message || "Falha ao fazer logout",
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao fazer logout";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Get current session
 */
export async function getSession(
  supabase: SupabaseClient
): Promise<ServiceResult<AuthSession | null>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        data: null,
        error: null,
      };
    }

    // Fetch user profile
    const profileResult = await getUserProfile(supabase, data.session.user.id);

    return {
      data: {
        user: data.session.user,
        profile: profileResult.data || undefined,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao obter sessão";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Reset password (sends email with reset link)
 */
export async function resetPassword(
  supabase: SupabaseClient,
  cpf: string
): Promise<ServiceResult<null>> {
  const normalizedCpf = normalizeDocument(cpf);
  const env = getPublicEnv();

  try {
    const email = `${normalizedCpf}@logflow.local`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/motorista/reset-password`,
    });

    if (error) {
      return {
        data: null,
        error: error.message || "Falha ao enviar email de recuperação",
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao resetar senha";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ServiceResult<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is not an error
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as UserProfile | null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao obter perfil do usuário";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Create user in Supabase Auth (used during person registration)
 * This uses Supabase Admin API functionality
 * Note: This should be called from a server-side context with admin privileges
 */
export async function createAuthUser(
  supabase: SupabaseClient,
  cpf: string,
  password: string,
  name: string,
  personId: string
): Promise<ServiceResult<{ userId: string; email: string } | null>> {
  const normalizedCpf = normalizeDocument(cpf);
  const env = getPublicEnv();

  try {
    // Create user with CPF as email
    const email = `${normalizedCpf}@logflow.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          cpf: normalizedCpf,
          name: name,
        },
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/motorista/verify-email`,
      },
    });

    if (error) {
      return {
        data: null,
        error: error.message || "Falha ao criar usuário",
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: "Usuário não criado",
      };
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      person_id: personId,
      name: name,
      cpf: normalizedCpf,
      role: "motorista",
    });

    if (profileError) {
      // Try to clean up the created user
      await supabase.auth.admin.deleteUser(data.user.id);
      return {
        data: null,
        error: profileError.message || "Falha ao criar perfil do usuário",
      };
    }

    return {
      data: {
        userId: data.user.id,
        email: email,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar usuário de autenticação";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Verify email with OTP code
 */
export async function verifyEmailOtp(
  supabase: SupabaseClient,
  email: string,
  token: string
): Promise<ServiceResult<AuthSession | null>> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      return {
        data: null,
        error: error.message || "Código inválido",
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: "Usuário não encontrado",
      };
    }

    // Fetch user profile
    const profileResult = await getUserProfile(supabase, data.user.id);

    return {
      data: {
        user: data.user,
        profile: profileResult.data || undefined,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao verificar email";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        data: null,
        error: error.message || "Falha ao atualizar senha",
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar senha";
    return {
      data: null,
      error: message,
    };
  }
}
