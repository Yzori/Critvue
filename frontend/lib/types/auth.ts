/**
 * Authentication Type Definitions
 * Comprehensive type safety for the Critvue authentication system
 */

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  user_tier?: string;
  karma_points?: number;
  role?: "creator" | "reviewer" | "admin";
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterResponse extends User {}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  reset_token: string;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>; // Now async to call backend logout endpoint
  refreshToken: () => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => void;
}

export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
