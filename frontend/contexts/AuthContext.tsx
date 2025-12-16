"use client";

/**
 * Authentication Context Provider
 * Manages global authentication state using httpOnly cookie-based authentication
 * No tokens stored in localStorage - all auth handled via secure httpOnly cookies
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  User,
  AuthContextType,
  LoginCredentials,
  RegisterCredentials,
} from "@/lib/types/auth";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "@/lib/api/auth";
import { clearAuthData, getErrorMessage } from "@/lib/api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state by checking with backend
  // httpOnly cookies are sent automatically, so we can verify auth status
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get current user from backend using httpOnly cookies
        // If cookies are valid, backend will return user data
        const userData = await getCurrentUser();
        setUser(userData);

        // Also cache user data in localStorage for quick access
        localStorage.setItem("user", JSON.stringify(userData));
      } catch {
        // No valid session - user needs to login
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user using httpOnly cookies
   * Backend sets secure httpOnly cookies automatically
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        // Backend returns user data and sets httpOnly cookies via Set-Cookie headers
        const userData = await loginUser(credentials);

        // Store user data locally for quick access (not security-sensitive)
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

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
   * Redirects to onboarding page after successful registration
   */
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        await registerUser(credentials);

        // After registration, log in the user
        const userData = await loginUser({
          email: credentials.email,
          password: credentials.password,
        });

        // Store user data locally for quick access
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Redirect to onboarding page for new users
        router.push("/onboarding");
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(message);
      }
    },
    [router]
  );

  /**
   * Logout user and clear httpOnly cookies
   * Calls backend logout endpoint to clear cookies server-side
   */
  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookies
      await logoutUser();
    } catch {
      // Continue with local cleanup even if backend call fails
    } finally {
      // Clear local user data
      clearAuthData();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  /**
   * Refresh access token using httpOnly refresh_token cookie
   * Token refresh is handled automatically by the API client
   * This function is provided for explicit refresh calls if needed
   */
  const refreshToken = useCallback(async () => {
    // Token refresh is handled automatically in apiClient
    // when it receives a 401 response
    // This is a no-op but kept for API compatibility
  }, []);

  /**
   * Update user avatar URL in context
   * Called after successful avatar upload
   */
  const updateUserAvatar = useCallback((avatarUrl: string) => {
    setUser((prevUser) => {
      if (!prevUser) return null;

      const updatedUser = { ...prevUser, avatar_url: avatarUrl };

      // Update localStorage cache
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUserAvatar,
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
