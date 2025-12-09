/**
 * API Client Configuration
 * Fetch-based client with httpOnly cookie authentication
 */

// Base API URL - configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Base backend URL for static files (without /api/v1)
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Get full URL for file served by backend
 * Handles both absolute URLs and relative paths
 * Rejects unsafe URLs (file://, javascript:, etc.)
 */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return "";

  // Reject unsafe URL schemes
  const lowerPath = path.toLowerCase();
  if (lowerPath.startsWith("file://") ||
      lowerPath.startsWith("javascript:") ||
      lowerPath.startsWith("data:")) {
    console.warn("Rejected unsafe URL scheme:", path.substring(0, 50));
    return "";
  }

  // If already absolute URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Prepend backend URL for relative paths
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type ApiError = {
  detail?: string | Array<{ msg: string; type: string }> | Record<string, any>;
  message?: string;
  error?: { code?: string; message?: string; details?: Record<string, any> };
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

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    // Network error (no response from server)
    throw new ApiClientError(0, { detail: "Unable to connect to server. Please check your internet connection." }, endpoint);
  }

  // Handle 401 errors - try to refresh token (but not for auth endpoints)
  // Auth endpoints should pass through their own error messages (e.g., "Incorrect email or password")
  const isAuthEndpoint = endpoint.includes('/auth/login') ||
                         endpoint.includes('/auth/register') ||
                         endpoint.includes('/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint) {
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
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    throw new ApiClientError(response.status, errorData, endpoint);
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
    public data: ApiError,
    public endpoint?: string
  ) {
    super(getErrorMessageFromApiError(status, data));
    this.name = 'ApiClientError';
  }

  /**
   * Check if this is a network/connectivity error
   */
  isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this error is retryable (network issues or 5xx)
   */
  isRetryable(): boolean {
    return this.isNetworkError() || this.isServerError() || this.status === 429;
  }
}

/**
 * Map HTTP status codes to user-friendly messages
 */
function getStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: "Invalid request. Please check your input.",
    401: "Please log in to continue.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with the current state.",
    422: "The data provided is invalid.",
    429: "Too many requests. Please wait a moment.",
    500: "Server error. Please try again later.",
    502: "Service temporarily unavailable.",
    503: "Service is currently unavailable. Please try again later.",
    504: "Request timed out. Please try again.",
  };
  return statusMessages[status] || `Request failed (${status})`;
}

/**
 * Extract error message from API error response with status context
 */
function getErrorMessageFromApiError(status: number, apiError: ApiError): string {
  // Handle validation errors (array of error objects)
  if (Array.isArray(apiError?.detail)) {
    return apiError.detail.map((err) => err.msg).join(", ");
  }

  // Handle string error messages from API
  if (typeof apiError?.detail === "string") {
    return apiError.detail;
  }

  // Handle structured error objects (e.g., APPLICATION_REQUIRED, TIER_PERMISSION_DENIED)
  if (typeof apiError?.detail === "object" && apiError?.detail !== null) {
    // Extract message from structured error
    if (apiError.detail.message) {
      return apiError.detail.message;
    }
    // Some structured errors might have a different field name
    if (apiError.detail.msg) {
      return apiError.detail.msg;
    }
  }

  // Handle CritvueException format: {"error": {"code": "...", "message": "..."}}
  if (typeof apiError?.error === "object" && apiError?.error !== null) {
    if (apiError.error.message) {
      return apiError.error.message;
    }
  }

  if (apiError?.message) {
    return apiError.message;
  }

  // Fall back to status-based message
  return getStatusMessage(status);
}

/**
 * Helper function to extract error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    // ApiClientError already has a well-formatted message from getErrorMessageFromApiError
    return error.message;
  }

  if (error instanceof Error) {
    // Network errors from fetch
    if (error.message === "Failed to fetch") {
      return "Unable to connect to server. Please check your internet connection.";
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Extract error message from a raw API error response object.
 * Use this when parsing error responses from raw fetch calls (not using apiClient).
 * Handles both legacy format (detail) and new CritvueException format (error.message).
 */
export function extractApiErrorMessage(errorData: any, fallback: string = "An error occurred"): string {
  // Handle CritvueException format: {"error": {"message": "..."}}
  if (errorData?.error?.message) {
    return errorData.error.message;
  }
  // Handle legacy/FastAPI format: {"detail": "..."}
  if (typeof errorData?.detail === "string") {
    return errorData.detail;
  }
  // Handle validation errors: {"detail": [{"msg": "..."}]}
  if (Array.isArray(errorData?.detail)) {
    return errorData.detail.map((err: any) => err.msg || err.message).join(", ");
  }
  // Handle structured detail with message
  if (errorData?.detail?.message) {
    return errorData.detail.message;
  }
  return fallback;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.isRetryable();
  }
  // Network errors are retryable
  if (error instanceof Error && error.message === "Failed to fetch") {
    return true;
  }
  return false;
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
