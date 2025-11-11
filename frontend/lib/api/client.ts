/**
 * API Client Configuration
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/lib/types/auth";

// Base API URL - configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("access_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: new_refresh_token } = response.data;

          // Store new tokens
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", new_refresh_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        // Only redirect if not already on auth pages
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;

    // Handle validation errors (array of error objects)
    if (Array.isArray(apiError?.detail)) {
      return apiError.detail
        .map((err) => err.msg)
        .join(", ");
    }

    // Handle string error messages
    if (typeof apiError?.detail === "string") {
      return apiError.detail;
    }

    if (apiError?.message) {
      return apiError.message;
    }

    // Network errors
    if (error.message === "Network Error") {
      return "Unable to connect to server. Please check your internet connection.";
    }

    // Timeout errors
    if (error.code === "ECONNABORTED") {
      return "Request timeout. Please try again.";
    }
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Helper function to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

/**
 * Helper function to clear auth data
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}
