/**
 * API Client Configuration
 * Fetch-based client with httpOnly cookie authentication
 */

// Base API URL - configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type ApiError = {
  detail?: string | Array<{ msg: string; type: string }>;
  message?: string;
};

/**
 * Main API client using fetch with automatic cookie handling
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Add credentials: 'include' to send httpOnly cookies
  const config: RequestInit = {
    ...options,
    credentials: 'include', // Automatically send cookies with requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response = await fetch(url, config);

  // Handle 401 errors - try to refresh token
  if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
    // Try to refresh token
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Sends refresh_token cookie
    });

    if (refreshResponse.ok) {
      // Retry original request with new access_token cookie
      response = await fetch(url, config);
    } else {
      // Refresh failed - redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    throw new ApiClientError(response.status, errorData);
  }

  // Parse JSON response
  return response.json();
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public data: ApiError
  ) {
    super(getErrorMessage(data));
    this.name = 'ApiClientError';
  }
}

/**
 * Helper function to extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const apiError = error.data;

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
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message === "Failed to fetch") {
      return "Unable to connect to server. Please check your internet connection.";
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Helper function to check if user is authenticated
 * With httpOnly cookies, we can't check directly - rely on server validation
 */
export function isAuthenticated(): boolean {
  // With httpOnly cookies, we can't check token directly
  // This should be used in conjunction with server-side validation
  // The AuthContext will manage the actual auth state
  return false; // Deprecated - use AuthContext.isAuthenticated instead
}

/**
 * Helper function to clear auth data
 * With httpOnly cookies, this just clears local user data
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  // Only clear user data - cookies are httpOnly and managed by backend
  localStorage.removeItem("user");
}

/**
 * HTTP Method Helpers
 * Convenience wrappers around apiClient for common HTTP methods
 */

// Extend apiClient with HTTP method helpers
type ApiClientWithMethods = typeof apiClient & {
  get: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => Promise<T>;
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => Promise<T>;
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) => Promise<T>;
  delete: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
};

// Add HTTP method helpers to apiClient
(apiClient as ApiClientWithMethods).get = async function<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'GET',
  });
};

(apiClient as ApiClientWithMethods).post = async function<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

(apiClient as ApiClientWithMethods).put = async function<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

(apiClient as ApiClientWithMethods).patch = async function<T = any>(
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

(apiClient as ApiClientWithMethods).delete = async function<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

// Export with type assertion
export default apiClient as ApiClientWithMethods;
