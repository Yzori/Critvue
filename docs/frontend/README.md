# Frontend Documentation

Comprehensive documentation for the Critvue Next.js frontend.

## Overview

The Critvue frontend is built with:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Context** for state management

## Quick Start

Get the frontend running in 5 minutes:

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

For detailed authentication setup, see [Authentication Quick Start](AUTH_QUICKSTART.md).

## Documentation

### Authentication
- **[Authentication Guide](AUTH_GUIDE.md)** - Complete auth system documentation
  - Architecture and features
  - Component documentation
  - API integration
  - Security features
  - Usage examples

- **[Authentication Quick Start](AUTH_QUICKSTART.md)** - 5-minute setup guide
  - Quick installation
  - Test flows
  - Common issues

- **[Password Reset](PASSWORD_RESET.md)** - Password reset implementation
  - Backend integration
  - Email flow (when configured)
  - Security considerations

## Architecture

### Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Auth pages (login, register, password-reset)
│   ├── dashboard/           # Protected dashboard page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/                # Auth-specific components
│   │   ├── ErrorAlert.tsx
│   │   ├── FormField.tsx
│   │   ├── PasswordStrength.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SocialLogin.tsx
│   │   └── SuccessAlert.tsx
│   └── ui/                  # Shared UI components (shadcn/ui)
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── contexts/
│   └── AuthContext.tsx      # Global authentication state
├── lib/
│   ├── api/                 # API client and endpoints
│   │   ├── client.ts        # Axios instance with interceptors
│   │   └── auth.ts          # Auth API calls
│   ├── types/               # TypeScript type definitions
│   │   └── auth.ts          # Auth types
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

### Key Features

**Authentication System:**
- JWT-based authentication with refresh tokens
- Login, registration, and password reset flows
- Protected route wrapper
- Automatic token management
- Social login placeholders (Google, GitHub)

**Mobile-Optimized UX:**
- All touch targets ≥ 44px
- Touch-manipulation classes
- Active feedback on interactions
- Single-column layouts on mobile
- Responsive typography and spacing

**Design System:**
- Critvue brand colors (accent-blue, accent-peach)
- Inter font family
- 4pt/8pt spacing grid
- Consistent border radius (8px-12px)
- WCAG 2.1 AA accessibility

## Development

### Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Adding New Features

When adding new features:
1. Follow existing folder structure
2. Use TypeScript for type safety
3. Follow Critvue brand guidelines
4. Ensure mobile-first responsive design
5. Add proper accessibility attributes
6. Update relevant documentation

## Design Guidelines

Follow these guides when building UI:
- [Brand & Design System](../product/critvue_brand_style.md)
- [Mobile-First UX Guide](../product/mobile_guide.md)

## API Integration

The frontend integrates with the FastAPI backend:
- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: Bearer token in Authorization header
- **Auto-refresh**: Tokens refresh automatically on 401 responses

See [Authentication Guide](AUTH_GUIDE.md) for detailed API integration.

## Testing

*Testing documentation coming soon*

## Deployment

*Deployment documentation coming soon*

## Troubleshooting

### Common Issues

**1. API Connection Error**
- Ensure backend is running on port 8000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify CORS is configured on backend

**2. Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run build`
- Clear `.next` folder and rebuild

**3. Authentication Not Working**
- Check browser console for errors
- Verify backend auth endpoints are running
- Clear localStorage and try again

For more help, see [Authentication Quick Start](AUTH_QUICKSTART.md).

## Contributing

When contributing to the frontend:
1. Follow TypeScript best practices
2. Maintain mobile-first responsive design
3. Adhere to Critvue brand guidelines
4. Test on multiple screen sizes
5. Update documentation for new features

---

**Need Help?** See the main [Documentation Index](../README.md) for more resources.
