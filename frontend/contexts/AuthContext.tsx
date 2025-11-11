"use client";

/**
 * Authentication Context Provider
 * Manages global authentication state and provides auth methods
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  User,
  AuthContextType,
  LoginCredentials,
  RegisterCredentials,
} from "@/lib/types/auth";
import { loginUser, registerUser } from "@/lib/api/auth";
import { clearAuthData, getErrorMessage } from "@/lib/api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const accessToken = localStorage.getItem("access_token");

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user and store tokens
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const response = await loginUser(credentials);

        // Store tokens and user data
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("user", JSON.stringify(response.user));

        setUser(response.user);

        // Redirect to dashboard or home
        router.push("/");
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(message);
      }
    },
    [router]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        await registerUser(credentials);

        // After registration, automatically log in
        await login({
          email: credentials.email,
          password: credentials.password,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(message);
      }
    },
    [login]
  );

  /**
   * Logout user and clear auth data
   */
  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    router.push("/login");
  }, [router]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // The refresh logic is handled by the API client interceptor
      // This function is here for explicit refresh calls if needed
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
