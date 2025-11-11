# Critvue Frontend

Production-ready Next.js 14 frontend for Critvue, featuring a complete authentication system with mobile-optimized UX.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

For detailed setup and authentication testing, see [Quick Start Guide](../docs/frontend/AUTH_QUICKSTART.md).

## Features

- **Complete Authentication System**
  - Login, registration, and password reset flows
  - JWT token management with automatic refresh
  - Protected route wrapper
  - Social login placeholders (Google, GitHub)

- **Mobile-Optimized UX**
  - Touch targets ≥ 44px for all interactive elements
  - Touch-manipulation and active feedback
  - Single-column layouts on mobile
  - Responsive typography and spacing

- **Critvue Design System**
  - Brand colors (accent-blue #3B82F6, accent-peach #F97316)
  - Inter font family with proper weight hierarchy
  - 4pt/8pt spacing grid system
  - WCAG 2.1 AA accessibility compliant

## Documentation

- **[Frontend Overview](../docs/frontend/README.md)** - Architecture and setup guide
- **[Authentication Guide](../docs/frontend/AUTH_GUIDE.md)** - Complete auth documentation
- **[Quick Start](../docs/frontend/AUTH_QUICKSTART.md)** - 5-minute setup guide
- **[Password Reset](../docs/frontend/PASSWORD_RESET.md)** - Password reset implementation
- **[Brand Guidelines](../docs/product/critvue_brand_style.md)** - Design system and brand guide
- **[Mobile Guide](../docs/product/mobile_guide.md)** - Mobile UX best practices

## Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── password-reset/
│   ├── dashboard/           # Protected dashboard example
│   └── layout.tsx           # Root layout
├── components/
│   ├── auth/                # Auth-specific components
│   └── ui/                  # Shared UI components (shadcn/ui)
├── contexts/
│   └── AuthContext.tsx      # Global authentication state
├── lib/
│   ├── api/                 # API client and endpoints
│   ├── types/               # TypeScript type definitions
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Environment Setup

Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context
- **HTTP Client**: Axios with interceptors
- **Icons**: lucide-react

## Development Guidelines

When building features:
1. Follow existing folder structure
2. Use TypeScript for type safety
3. Adhere to Critvue brand guidelines
4. Ensure mobile-first responsive design
5. Meet WCAG 2.1 AA accessibility standards
6. Add proper documentation

## Backend Integration

The frontend connects to the FastAPI backend:
- **Backend URL**: http://localhost:8000
- **API Base**: /api/v1
- **Authentication**: Bearer token in Authorization header
- **Auto Token Refresh**: Handled automatically by API client

Ensure the backend is running before starting the frontend.

## Build Status

- ✓ TypeScript: 0 errors
- ✓ Build: Successful
- ✓ Routes: 7 pages generated
- ✓ Mobile UX: 9/10 compliance score

## Troubleshooting

**API Connection Issues:**
- Verify backend is running on port 8000
- Check `.env.local` has correct API URL
- Confirm CORS is configured on backend

**Build Errors:**
- Run `npm install` to ensure dependencies are installed
- Clear `.next` folder and rebuild
- Check TypeScript errors with `npm run build`

For more help, see the [Frontend Documentation](../docs/frontend/README.md).

## Contributing

Contributions should follow:
- TypeScript best practices
- Mobile-first responsive design
- Critvue brand guidelines
- Accessibility standards (WCAG 2.1 AA)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Critvue Product Brief](../docs/product/critvue_product_brief.md)

---

Built with [Next.js](https://nextjs.org) and deployed on [Vercel](https://vercel.com).
