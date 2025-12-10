/**
 * Next.js 14 Middleware for Route Protection
 * Multi-layer authentication: validates httpOnly cookies by checking /api/v1/users/me
 * Protects all routes starting with /dashboard
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/apply/expert/status", "/profile"];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/about", "/pricing", "/contact", "/apply/expert", "/browse", "/review", "/how-it-works"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Check if the current path is a public route
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/")) ||
    pathname.startsWith("/api");

  // For public routes, allow access
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Validate authentication by checking if user can access /auth/me endpoint
  // This validates the httpOnly cookies server-side
  const isAuthenticated = await checkAuthentication(request);

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Add redirect parameter to return to original page after login
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If accessing auth routes (login/register) while authenticated, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Check if user is authenticated by validating httpOnly cookies
 * Makes a request to the backend /auth/me endpoint
 */
async function checkAuthentication(request: NextRequest): Promise<boolean> {
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    // Get cookies from the request
    const cookies = request.cookies;

    // Build cookie header string
    const cookieHeader = cookies
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Make request to backend to validate authentication
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      // Don't use credentials: 'include' in middleware - manually pass cookies
    });

    // If response is OK (200), user is authenticated
    return response.ok;
  } catch {
    // If there's an error (network, server down, etc.), assume not authenticated
    return false;
  }
}

// Configure which routes should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
