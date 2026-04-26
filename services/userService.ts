import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceResult } from "./types";
import type { UserProfile, UserRole, UpdateProfilePayload } from "@/types/user.types";

/**
 * Get all users (admin/operador only)
 */
export async function listUsers(
  supabase: SupabaseClient,
  filters?: {
    role?: UserRole;
    limit?: number;
    offset?: number;
  }
): Promise<ServiceResult<UserProfile[]>> {
  try {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (filters?.role) {
      query = query.eq("role", filters.role);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile[]) || [],
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar usuários";
    return {
      data: [],
      error: message,
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(
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
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile) || null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao obter usuário";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Get user by CPF
 */
export async function getUserByCpf(
  supabase: SupabaseClient,
  cpf: string
): Promise<ServiceResult<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("cpf", cpf)
      .single();

    if (error && error.code !== "PGRST116") {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile) || null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao obter usuário por CPF";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Update user profile (name, role)
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: UpdateProfilePayload
): Promise<ServiceResult<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile) || null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar perfil";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Delete user profile
 */
export async function deleteUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ServiceResult<null>> {
  try {
    // The profile will be automatically deleted due to ON DELETE CASCADE
    // But we need to use admin API to delete from auth.users
    // For now, just soft delete by removing profile

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar usuário";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<ServiceResult<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile) || null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar role do usuário";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Check if user exists by CPF
 */
export async function checkUserExists(
  supabase: SupabaseClient,
  cpf: string
): Promise<ServiceResult<boolean>> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("cpf", cpf);

    if (error) {
      return {
        data: false,
        error: error.message,
      };
    }

    return {
      data: (count ?? 0) > 0,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao verificar usuário";
    return {
      data: false,
      error: message,
    };
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(
  supabase: SupabaseClient,
  role: UserRole
): Promise<ServiceResult<UserProfile[]>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", role)
      .order("name", { ascending: true });

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile[]) || [],
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar usuários por role";
    return {
      data: [],
      error: message,
    };
  }
}

/**
 * Search users by name or CPF
 */
export async function searchUsers(
  supabase: SupabaseClient,
  query: string
): Promise<ServiceResult<UserProfile[]>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`name.ilike.%${query}%,cpf.ilike.%${query}%`)
      .order("name", { ascending: true });

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (data as UserProfile[]) || [],
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar usuários";
    return {
      data: [],
      error: message,
    };
  }
}
