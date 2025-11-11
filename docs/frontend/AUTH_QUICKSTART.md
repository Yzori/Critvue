# Critvue Authentication - Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Create .env.local file (already created)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start Backend (in separate terminal)
```bash
cd backend
uvicorn app.main:app --reload
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

### 5. Test Authentication
Navigate to: http://localhost:3000/register

## Quick Test Flow

1. **Register New User:**
   - Go to http://localhost:3000/register
   - Fill in: Name, Email, Password (min 8 chars with mix of upper/lower/number/special)
   - Check "I agree to terms"
   - Click "Create account"
   - Should auto-redirect to dashboard

2. **Login:**
   - Go to http://localhost:3000/login
   - Enter registered email and password
   - Click "Sign in"
   - Should redirect to dashboard

3. **Password Reset:**
   - Go to http://localhost:3000/password-reset/request
   - Enter email
   - Check backend console for reset token
   - Go to http://localhost:3000/password-reset/reset?token=YOUR_TOKEN
   - Enter new password
   - Should show success message

4. **Protected Route:**
   - Go to http://localhost:3000/dashboard
   - Should see user info if logged in
   - Should redirect to /login if not logged in

## Available Routes

### Public Routes
- `/login` - User login
- `/register` - New user registration
- `/password-reset/request` - Request password reset
- `/password-reset/reset?token=xxx` - Reset password with token

### Protected Routes (Example)
- `/dashboard` - Example dashboard (requires auth)

## Using Auth in Your Components

### Check Authentication Status
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protect a Page
```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <YourPageContent />
    </ProtectedRoute>
  );
}
```

### Manual Login
```typescript
const { login } = useAuth();

try {
  await login({
    email: "user@example.com",
    password: "password123"
  });
  // User is redirected automatically
} catch (error) {
  console.error(error.message);
}
```

## Troubleshooting

### Backend Not Running
**Error:** Network Error or Connection Refused
**Solution:** Make sure backend is running on port 8000
```bash
cd backend
uvicorn app.main:app --reload
```

### CORS Issues
**Error:** CORS policy blocked
**Solution:** Backend needs to allow frontend origin. Check `main.py` CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Issues
**Error:** 401 Unauthorized
**Solution:** Clear localStorage and login again
```javascript
// In browser console:
localStorage.clear()
// Then login again
```

### Build Issues
**Error:** TypeScript errors
**Solution:** Check that all dependencies are installed
```bash
npm install
npm run build
```

## Key Files Reference

### Configuration
- `.env.local` - Environment variables
- `app/layout.tsx` - Root layout with AuthProvider

### Authentication Pages
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Registration page
- `app/(auth)/password-reset/request/page.tsx` - Request reset
- `app/(auth)/password-reset/reset/page.tsx` - Confirm reset

### Core Logic
- `contexts/AuthContext.tsx` - Auth state management
- `lib/api/client.ts` - HTTP client with token handling
- `lib/api/auth.ts` - Auth API endpoints

### Shared Components
- `components/auth/ProtectedRoute.tsx` - Route guard
- `components/auth/FormField.tsx` - Form input with validation
- `components/auth/PasswordStrength.tsx` - Password strength indicator

## Next Steps

1. **Test All Flows:** Register, login, logout, password reset
2. **Check Mobile:** Test on mobile devices or browser DevTools
3. **Review Security:** Ensure HTTPS in production
4. **Add OAuth:** Integrate Google/GitHub when ready
5. **Email Verification:** Implement when backend is ready

## Documentation

- **Full Documentation:** See `AUTH_SYSTEM.md`
- **Implementation Report:** See `AUTH_IMPLEMENTATION_REPORT.md`
- **Inline Comments:** All code files have detailed comments

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify environment variables are set
4. Clear localStorage and try again
5. Review the troubleshooting section in `AUTH_SYSTEM.md`

## Production Deployment

Before deploying to production:

1. **Update Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.critvue.com/api/v1
```

2. **Build for Production:**
```bash
npm run build
npm start
```

3. **Security Checklist:**
   - [ ] HTTPS enabled
   - [ ] Environment variables secured
   - [ ] CORS configured properly
   - [ ] Rate limiting enabled on backend
   - [ ] Error messages don't leak sensitive info
   - [ ] Tokens use httpOnly cookies (if migrating from localStorage)

## Success!

Your authentication system is ready to use. Start by registering a new account at http://localhost:3000/register
