export type UserRole = "admin" | "operador" | "motorista";

export interface UserProfile {
  id: string;
  person_id: string;
  name: string;
  cpf: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      cpf?: string;
      name?: string;
    };
  };
  profile?: UserProfile;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    cpf?: string;
    name?: string;
  };
}

export interface SignInPayload {
  cpf: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  role?: UserRole;
}

export interface AuthError {
  code?: string;
  message: string;
  status?: number;
}

export interface CreateUserPayload {
  cpf: string;
  email?: string;
  password?: string;
  user_metadata?: {
    cpf?: string;
    name?: string;
  };
}
