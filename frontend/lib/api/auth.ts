/**
 * Authentication API Service
 * All authentication-related API calls using httpOnly cookie authentication
 */

import apiClient from "./client";
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
 * Backend sets httpOnly cookies (access_token, refresh_token) automatically
 * Returns only user data for frontend state management
 */
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  // Backend sets cookies automatically via Set-Cookie headers
  // Return only user data for frontend state
  return response.user;
}

/**
 * Register new user
 * Returns registration response (may include user data or confirmation message)
 */
export async function registerUser(credentials: RegisterCredentials): Promise<RegisterResponse> {
  return await apiClient.post<RegisterResponse>("/auth/register", credentials);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  data: PasswordResetRequest
): Promise<PasswordResetRequestResponse> {
  return await apiClient.post<PasswordResetRequestResponse>("/password-reset/request", data);
}

/**
 * Reset password with token
 */
export async function resetPassword(data: PasswordReset): Promise<PasswordResetResponse> {
  return await apiClient.post<PasswordResetResponse>("/password-reset/reset", data);
}

/**
 * Get current user profile (protected endpoint)
 * Uses httpOnly cookies for authentication - no token needed in request
 */
export async function getCurrentUser(): Promise<User> {
  return await apiClient.get<User>("/users/me");
}

/**
 * Refresh access token using httpOnly refresh_token cookie
 * Backend reads refresh_token from cookie automatically
 * No need to send token in request body
 */
export async function refreshAccessToken(): Promise<void> {
  // Cookies are sent automatically via credentials: 'include'
  // Backend validates refresh_token cookie and sets new access_token cookie
  await apiClient.post<void>("/auth/refresh");
}

/**
 * Logout user and clear httpOnly cookies
 * Backend clears the httpOnly cookies on the server side
 */
export async function logoutUser(): Promise<void> {
  await apiClient.post<void>("/auth/logout");
}
