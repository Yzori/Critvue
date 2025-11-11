# Critvue Authentication System

Complete authentication system implementation for the Critvue frontend application.

## Overview

This authentication system provides secure user authentication with the following features:

- User registration with validation
- Email/password login
- Password reset flow
- JWT token management with automatic refresh
- Protected routes
- Session persistence
- Social login placeholders (Google, GitHub)

## Architecture

### Component Structure

```
frontend/
├── app/
│   ├── (auth)/                      # Auth pages group
│   │   ├── layout.tsx               # Shared auth layout
│   │   ├── login/page.tsx           # Login page
│   │   ├── register/page.tsx        # Registration page
│   │   └── password-reset/
│   │       ├── request/page.tsx     # Request reset
│   │       └── reset/page.tsx       # Confirm reset
│   ├── dashboard/page.tsx           # Example protected page
│   └── layout.tsx                   # Root layout (with AuthProvider)
├── components/
│   ├── auth/
│   │   ├── ErrorAlert.tsx           # Error display component
│   │   ├── FormField.tsx            # Form input with validation
│   │   ├── PasswordStrength.tsx     # Password strength indicator
│   │   ├── ProtectedRoute.tsx       # Auth guard component
│   │   ├── SocialLogin.tsx          # Social login buttons
│   │   └── SuccessAlert.tsx         # Success message component
│   └── ui/                          # Shared UI components
├── contexts/
│   └── AuthContext.tsx              # Auth state management
├── lib/
│   ├── api/
│   │   ├── auth.ts                  # Auth API endpoints
│   │   └── client.ts                # Axios client with interceptors
│   └── types/
│       └── auth.ts                  # TypeScript types
└── .env.local                       # Environment variables
```

## Features

### 1. User Registration

**Location:** `/app/(auth)/register/page.tsx`

Features:
- Full name, email, password validation
- Password strength indicator with real-time feedback
- Password confirmation matching
- Terms of service acceptance checkbox
- Client-side validation with error messages
- Automatic login after successful registration

### 2. User Login

**Location:** `/app/(auth)/login/page.tsx`

Features:
- Email and password authentication
- "Remember me" option
- Show/hide password toggle
- "Forgot password?" link
- Social login placeholders (Google, GitHub)
- Error handling with user-friendly messages

### 3. Password Reset Flow

**Request Reset:** `/app/(auth)/password-reset/request/page.tsx`
- Email input to request reset link
- Success state with instructions
- Resend option

**Reset Password:** `/app/(auth)/password-reset/reset/page.tsx`
- Token validation from URL query parameter
- New password input with strength indicator
- Password confirmation
- Success state with login redirect

### 4. Authentication State Management

**AuthContext:** `/contexts/AuthContext.tsx`

Provides:
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

Usage:
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 5. Protected Routes

**Component:** `/components/auth/ProtectedRoute.tsx`

Wraps pages that require authentication:

```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

Features:
- Automatic redirect to login if not authenticated
- Loading state during auth check
- Return URL preservation for post-login redirect

### 6. API Client

**Client:** `/lib/api/client.ts`

Features:
- Axios instance with default configuration
- Request interceptor to add JWT token
- Response interceptor for automatic token refresh
- Error handling and network timeout
- Helper functions for error messages

**Auth API:** `/lib/api/auth.ts`

Endpoints:
- `loginUser(credentials)` - POST /auth/login
- `registerUser(credentials)` - POST /auth/register
- `requestPasswordReset(data)` - POST /password-reset/request
- `resetPassword(data)` - POST /password-reset/reset
- `getCurrentUser()` - GET /users/me
- `refreshAccessToken(token)` - POST /auth/refresh

## Design System Compliance

All components follow the Critvue brand guidelines:

### Colors
- **Primary Blue:** `var(--accent-blue)` - #3B82F6
- **Accent Peach:** `var(--accent-peach)` - #F97316
- **Error/Destructive:** `var(--destructive)`
- **Muted Text:** `var(--foreground-muted)` - #6B7280

### Typography
- **Font:** Inter (primary), IBM Plex Mono (code)
- **Sizes:** Following 4pt/8pt scale
- **Weights:** Medium (500) for labels, Semibold (600) for headings

### Spacing
- Form fields: 16px (1rem) vertical spacing
- Containers: 24px padding on mobile, 32px on desktop
- Component gaps: 8px, 12px, 16px, 24px

### Border Radius
- Inputs/Buttons: 8px (rounded-md)
- Cards: 12px (rounded-lg)
- Icons: 8px-16px depending on size

### Shadows
- Cards: `shadow-sm` for subtle elevation
- Focus states: Ring with 3px offset using accent colors

## Mobile Optimization

All auth pages are mobile-first and responsive:

- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Font Sizes:** Base 16px on mobile, 14px on desktop for forms
- **Layout:** Single column on mobile, centered 448px max-width card

## Accessibility

WCAG 2.1 Level AA compliance:

- **Keyboard Navigation:** Full support with visible focus states
- **Screen Readers:**
  - Semantic HTML elements
  - ARIA labels and descriptions
  - Live regions for error/success messages
- **Color Contrast:**
  - Text: 4.5:1 minimum
  - Interactive elements: 3:1 minimum
- **Form Labels:** All inputs have associated labels
- **Error Handling:** Clear, actionable error messages

## Security Features

1. **Token Storage:** LocalStorage with automatic cleanup
2. **Token Refresh:** Automatic refresh on 401 responses
3. **CSRF Protection:** Token-based authentication
4. **Password Validation:**
   - Minimum 8 characters
   - Uppercase, lowercase, number, special character
5. **Client-side Validation:** Prevents invalid API calls
6. **No Console Logging:** Sensitive data never logged
7. **Secure Headers:** Content-Type validation

## Environment Configuration

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production:

```bash
NEXT_PUBLIC_API_URL=https://api.critvue.com/api/v1
```

## Usage Examples

### Login Example

```typescript
const { login } = useAuth();

try {
  await login({
    email: "user@example.com",
    password: "SecurePassword123!"
  });
  // User is automatically redirected
} catch (error) {
  console.error("Login failed:", error.message);
}
```

### Register Example

```typescript
const { register } = useAuth();

try {
  await register({
    email: "newuser@example.com",
    password: "SecurePassword123!",
    full_name: "John Doe"
  });
  // User is automatically logged in and redirected
} catch (error) {
  console.error("Registration failed:", error.message);
}
```

### Logout Example

```typescript
const { logout } = useAuth();

// Simply call logout
logout(); // Clears tokens and redirects to /login
```

### Protected Page Example

```typescript
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function ProfileContent() {
  const { user } = useAuth();
  return <div>Welcome, {user?.full_name}!</div>;
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Register new user with valid data
- [ ] Register with invalid email format
- [ ] Register with weak password
- [ ] Register with non-matching passwords
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Access protected page without auth (should redirect)
- [ ] Access protected page with auth (should show content)
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with invalid token
- [ ] Logout and verify tokens cleared
- [ ] Token refresh on expired access token
- [ ] Remember me functionality
- [ ] Social login button states

### Testing with Backend

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend dev server:
```bash
cd frontend
npm run dev
```

3. Navigate to `http://localhost:3000/register`

4. Complete registration and verify:
   - User created in database
   - Tokens received and stored
   - Redirect to dashboard

## Troubleshooting

### Common Issues

**Issue:** "Network Error" on API calls
- **Solution:** Check backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**Issue:** 401 Unauthorized errors
- **Solution:** Check token in localStorage
- Verify backend JWT secret matches
- Clear localStorage and login again

**Issue:** Redirect loop on protected pages
- **Solution:** Check AuthProvider is wrapping app
- Verify token refresh logic in API client

**Issue:** CORS errors
- **Solution:** Backend must allow frontend origin
- Check FastAPI CORS middleware configuration

## Future Enhancements

- [ ] OAuth integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Email verification flow
- [ ] Session management (view active sessions)
- [ ] Account settings page
- [ ] Profile picture upload
- [ ] Password change (when logged in)
- [ ] Account deletion
- [ ] Remember device functionality
- [ ] Biometric authentication support

## Support

For issues or questions:
- Review this documentation
- Check browser console for errors
- Verify backend API is responding
- Test with backend API docs at `/docs`
