/**
 * Authentication API Service
 * All authentication-related API calls
 */

import { apiClient } from "./client";
import type {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordReset,
  PasswordResetResponse,
  User,
} from "@/lib/types/auth";

/**
 * Login user with email and password
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  return response.data;
}

/**
 * Register new user
 */
export async function registerUser(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>("/auth/register", credentials);
  return response.data;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  data: PasswordResetRequest
): Promise<PasswordResetRequestResponse> {
  const response = await apiClient.post<PasswordResetRequestResponse>(
    "/password-reset/request",
    data
  );
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(data: PasswordReset): Promise<PasswordResetResponse> {
  const response = await apiClient.post<PasswordResetResponse>("/password-reset/reset", data);
  return response.data;
}

/**
 * Get current user profile (protected endpoint)
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/users/me");
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return response.data;
}
