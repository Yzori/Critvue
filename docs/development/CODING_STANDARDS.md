# Critvue Coding Standards & Best Practices

> **Version:** 1.0.0
> **Last Updated:** December 2024
> **Applies to:** Frontend (Next.js/React/TypeScript) & Backend (FastAPI/Python)

This document defines coding standards for the Critvue codebase to ensure consistency, maintainability, and adherence to 2024-2025 best practices. Claude Code and all developers should follow these guidelines.

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Project Structure](#2-project-structure)
3. [TypeScript & JavaScript Standards](#3-typescript--javascript-standards)
4. [React & Next.js Standards](#4-react--nextjs-standards)
5. [Python & FastAPI Standards](#5-python--fastapi-standards)
6. [Naming Conventions](#6-naming-conventions)
7. [Error Handling](#7-error-handling)
8. [API Design](#8-api-design)
9. [Database & Data Layer](#9-database--data-layer)
10. [Security Standards](#10-security-standards)
11. [Testing Standards](#11-testing-standards)
12. [Documentation Standards](#12-documentation-standards)
13. [Performance & Optimization](#13-performance--optimization)
14. [Accessibility Standards](#14-accessibility-standards)
15. [Git & Version Control](#15-git--version-control)

---

## 1. General Principles

### 1.1 Core Philosophy

Follow these foundational principles in all code:

| Principle | Description |
|-----------|-------------|
| **KISS** | Keep It Simple, Stupid - Avoid unnecessary complexity |
| **YAGNI** | You Aren't Gonna Need It - Don't build features until needed |
| **DRY** | Don't Repeat Yourself - Extract common logic into reusable units |
| **SOLID** | Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion |

### 1.2 Code Quality Rules

```
DO:
- Write code for humans first, machines second
- Keep functions small and focused (single responsibility)
- Use descriptive names that reveal intent
- Prefer composition over inheritance
- Make dependencies explicit through injection
- Write self-documenting code; add comments only for "why", not "what"

DON'T:
- Use magic numbers or strings - define constants
- Leave dead code or commented-out code
- Over-engineer or prematurely optimize
- Use abbreviations in names (except well-known: id, url, api)
- Nest more than 3 levels deep
- Create "god" classes/functions that do too much
```

### 1.3 Sustainable Code Practices

Per 2025 sustainable software engineering guidelines:

- **Minimize dependencies** - Each dependency adds maintenance burden and security surface
- **Remove unused code** - Dead code wastes cognitive load and increases bundle size
- **Avoid redundant operations** - Cache expensive calculations, prevent duplicate API calls
- **Modular architecture** - Enable updating components without full system overhaul
- **Regular refactoring** - Address technical debt incrementally

---

## 2. Project Structure

### 2.1 Frontend Structure (Next.js App Router)

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Route groups (public auth pages)
│   ├── (authenticated)/          # Protected route group
│   ├── [feature]/                # Feature-specific routes
│   │   ├── page.tsx              # Page component
│   │   ├── layout.tsx            # Layout (if needed)
│   │   └── loading.tsx           # Loading state
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI primitives (buttons, inputs, etc.)
│   ├── [feature]/                # Feature-specific components
│   └── navigation/               # Navigation components
├── contexts/                     # React Context providers
├── hooks/                        # Custom React hooks
├── lib/
│   ├── api/                      # API client & endpoint functions
│   ├── types/                    # TypeScript interfaces & types
│   ├── utils/                    # Utility functions
│   └── constants/                # Application constants
├── stores/                       # Zustand stores (if needed)
├── __tests__/                    # Unit tests
└── e2e/                          # End-to-end tests (Playwright)
```

### 2.2 Backend Structure (FastAPI)

```
backend/
├── app/
│   ├── api/                      # API routers
│   │   ├── auth/                 # Auth endpoints (modular)
│   │   ├── v1/                   # Versioned API endpoints
│   │   │   └── [feature]/        # Feature-specific routers
│   │   ├── deps.py               # Dependency injection functions
│   │   └── webhooks.py           # Webhook handlers
│   ├── core/                     # Core configuration
│   │   ├── config.py             # Settings (Pydantic BaseSettings)
│   │   ├── exceptions.py         # Custom exception classes
│   │   ├── exception_handlers.py # Global exception handlers
│   │   ├── security.py           # JWT, password hashing
│   │   └── logging_config.py     # Logging setup
│   ├── crud/                     # CRUD operations (repository pattern)
│   │   └── base.py               # Generic BaseRepository[T]
│   ├── db/                       # Database configuration
│   │   └── session.py            # Async engine & session
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic validation schemas
│   ├── services/                 # Business logic layer
│   ├── constants/                # Application constants
│   ├── utils/                    # Utility functions
│   └── main.py                   # FastAPI app initialization
├── alembic/                      # Database migrations
│   └── versions/                 # Migration files
├── tests/                        # Test suite
│   ├── conftest.py               # Pytest fixtures
│   └── integration/              # Integration tests
└── requirements.txt              # Dependencies
```

### 2.3 File Organization Rules

```
RULES:
1. Group by feature, not by type (for larger features)
2. Keep related files close together
3. One component/class per file (with rare exceptions)
4. Index files (__init__.py, index.ts) for clean imports
5. Co-locate tests with source files OR in parallel test directory
6. Shared utilities go in lib/utils or app/utils
```

---

## 3. TypeScript & JavaScript Standards

### 3.1 TypeScript Configuration

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 3.2 Type Definitions

```typescript
// DO: Use explicit types
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;          // Optional with ?
  createdAt: Date;
}

// DO: Use type for unions and primitives
type UserRole = 'admin' | 'reviewer' | 'creator';
type UserId = string;

// DO: Use interface for objects that may be extended
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  email: string;
  role: UserRole;
}

// DON'T: Use `any` - use `unknown` if type is truly unknown
// Bad
function processData(data: any) { ... }

// Good
function processData(data: unknown) {
  if (isValidData(data)) {
    // Type narrowed, safe to use
  }
}

// DO: Use utility types
type PartialUser = Partial<User>;
type ReadonlyUser = Readonly<User>;
type UserKeys = keyof User;
type UserWithoutId = Omit<User, 'id'>;
type UserIdAndEmail = Pick<User, 'id' | 'email'>;
```

### 3.3 Function Signatures

```typescript
// DO: Explicit return types for public functions
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// DO: Use async/await over .then() chains
async function fetchUser(id: string): Promise<User> {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response;
}

// DO: Default parameters over optional with undefined check
function greet(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`;
}

// DO: Object parameters for functions with 3+ parameters
interface CreateUserOptions {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

function createUser(options: CreateUserOptions): Promise<User> { ... }

// DON'T: Positional parameters for many arguments
// Bad
function createUser(email: string, password: string, displayName?: string, role?: string) { ... }
```

### 3.4 Null & Undefined Handling

```typescript
// DO: Use optional chaining
const userName = user?.profile?.displayName;

// DO: Use nullish coalescing for defaults
const displayName = user.displayName ?? 'Anonymous';

// DO: Early return for null checks (guard clauses)
function processUser(user: User | null): void {
  if (!user) {
    return;
  }
  // user is now narrowed to User
  console.log(user.email);
}

// DON'T: Nested null checks
// Bad
if (user) {
  if (user.profile) {
    if (user.profile.settings) {
      // deeply nested
    }
  }
}
```

### 3.5 Modern JavaScript Features (ES2024+)

```typescript
// DO: Use const by default, let when reassignment needed
const immutableValue = 'fixed';
let mutableCounter = 0;

// DO: Destructuring
const { id, email, displayName } = user;
const [first, second, ...rest] = items;

// DO: Template literals
const message = `User ${user.displayName} has ${count} reviews`;

// DO: Spread operator for immutable updates
const updatedUser = { ...user, displayName: 'New Name' };
const combined = [...array1, ...array2];

// DO: Object shorthand
const user = { id, email, displayName };

// DO: Array methods over loops
const activeUsers = users.filter(u => u.isActive);
const userNames = users.map(u => u.displayName);
const totalAge = users.reduce((sum, u) => sum + u.age, 0);
const hasAdmin = users.some(u => u.role === 'admin');
const allActive = users.every(u => u.isActive);
```

---

## 4. React & Next.js Standards

### 4.1 Component Structure

```tsx
// Standard component file structure
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

// 1. Types/Interfaces first
interface UserCardProps {
  user: UserProfile;
  onSelect?: (user: UserProfile) => void;
  className?: string;
  isLoading?: boolean;
}

// 2. Component definition
export function UserCard({
  user,
  onSelect,
  className,
  isLoading = false
}: UserCardProps) {
  // 3. Hooks at top
  const [isExpanded, setIsExpanded] = useState(false);

  // 4. Derived state (computed values)
  const displayName = user.displayName || user.email;

  // 5. Effects (use sparingly)
  useEffect(() => {
    // Side effect logic
  }, [dependency]);

  // 6. Event handlers
  const handleClick = () => {
    onSelect?.(user);
  };

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // 7. Early returns for loading/error states
  if (isLoading) {
    return <UserCardSkeleton />;
  }

  // 8. Main render
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3 className="font-semibold">{displayName}</h3>
      <Button onClick={handleClick}>Select</Button>
    </div>
  );
}

// 9. Sub-components in same file if small and tightly coupled
function UserCardSkeleton() {
  return <div className="animate-pulse h-24 rounded-lg bg-muted" />;
}
```

### 4.2 Custom Hooks

```tsx
// hooks/useAsync.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [asyncFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, error, isLoading, execute, reset };
}
```

### 4.3 Hook Rules & Best Practices

```tsx
// DO: Create custom hooks when logic is reused or complex
// DO: Name hooks starting with "use"
// DO: Keep hooks focused on single responsibility
// DO: Use dependency arrays correctly

// DON'T: Call hooks conditionally
// Bad
if (isLoggedIn) {
  const user = useUser(); // WRONG!
}

// Good
const user = useUser();
if (isLoggedIn && user) {
  // use user
}

// DON'T: Overuse useEffect
// Bad - fetching in useEffect
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]);

// Good - use React Query or similar
const { data: user, isLoading } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id)
});

// DO: Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return items.reduce((acc, item) => acc + complexCalculation(item), 0);
}, [items]);

// DO: Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);

// DON'T: Over-memoize simple values
// Bad - unnecessary memoization
const greeting = useMemo(() => `Hello, ${name}`, [name]);

// Good - just compute it
const greeting = `Hello, ${name}`;
```

### 4.4 State Management Patterns

```tsx
// 1. Local state (useState) - UI state, form inputs
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');

// 2. Server state (React Query) - API data
const { data, isLoading, error } = useQuery({
  queryKey: ['reviews', userId],
  queryFn: () => fetchReviews(userId),
  staleTime: 60 * 1000,        // 1 minute
  gcTime: 5 * 60 * 1000,       // 5 minutes
});

// 3. Global client state (Context) - Auth, theme
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const value = useMemo(() => ({
    user,
    isLoading,
    login: async (credentials: Credentials) => { ... },
    logout: async () => { ... },
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 4. Complex local state (Zustand) - Multi-step forms
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormStore {
  step: number;
  data: FormData;
  setStep: (step: number) => void;
  updateData: (data: Partial<FormData>) => void;
  reset: () => void;
}

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      step: 1,
      data: initialData,
      setStep: (step) => set({ step }),
      updateData: (data) => set((state) => ({
        data: { ...state.data, ...data }
      })),
      reset: () => set({ step: 1, data: initialData }),
    }),
    { name: 'form-storage' }
  )
);
```

### 4.5 Styling Standards (Tailwind CSS)

```tsx
// DO: Use Tailwind utility classes
<div className="flex items-center gap-4 rounded-lg border p-4 shadow-sm">

// DO: Use cn() for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    'rounded-md px-4 py-2 font-medium transition-colors',
    'hover:bg-primary/90 focus:outline-none focus:ring-2',
    isActive && 'bg-primary text-primary-foreground',
    isDisabled && 'cursor-not-allowed opacity-50'
  )}
>

// DO: Use CVA for component variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// DO: Mobile-first responsive design
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// DO: Dark mode support with CSS variables
<div className="bg-background text-foreground">
```

### 4.6 Form Handling

```tsx
// Use React Hook Form + Zod for complex forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signUp(data);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email')}
        type="email"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />
      {errors.email && (
        <p id="email-error" className="text-sm text-destructive">
          {errors.email.message}
        </p>
      )}
      {/* ... other fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
}
```

---

## 5. Python & FastAPI Standards

### 5.1 Python Code Style

```python
# Follow PEP 8 with these specifics:

# DO: Use type hints for all function signatures
def calculate_total(items: list[CartItem], discount: float = 0.0) -> Decimal:
    """Calculate total price with optional discount."""
    subtotal = sum(item.price for item in items)
    return subtotal * (1 - discount)

# DO: Use dataclasses or Pydantic for data structures
from dataclasses import dataclass
from pydantic import BaseModel

@dataclass
class Point:
    x: float
    y: float

class UserCreate(BaseModel):
    email: EmailStr
    password: str

# DO: Use explicit None checks
def get_user(user_id: int) -> User | None:
    ...

# DO: Use f-strings for formatting
message = f"User {user.email} created at {user.created_at}"

# DO: Use context managers for resources
async with async_session_maker() as session:
    result = await session.execute(query)

# DO: Use pathlib for file paths
from pathlib import Path
config_path = Path(__file__).parent / "config.yaml"

# DON'T: Use mutable default arguments
# Bad
def add_item(item: str, items: list = []) -> list:
    items.append(item)
    return items

# Good
def add_item(item: str, items: list | None = None) -> list:
    if items is None:
        items = []
    items.append(item)
    return items
```

### 5.2 Async Patterns

```python
# DO: Use async for I/O operations
async def fetch_user(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()

# DO: Use asyncio.gather for concurrent operations
async def fetch_user_data(user_id: int) -> UserData:
    profile, reviews, settings = await asyncio.gather(
        fetch_profile(user_id),
        fetch_reviews(user_id),
        fetch_settings(user_id),
    )
    return UserData(profile=profile, reviews=reviews, settings=settings)

# DON'T: Block the event loop with sync operations in async functions
# Bad
async def process_file(path: str) -> str:
    with open(path) as f:  # Blocking!
        return f.read()

# Good
async def process_file(path: str) -> str:
    async with aiofiles.open(path) as f:
        return await f.read()

# Or use run_in_executor for CPU-bound work
async def process_image(image_data: bytes) -> bytes:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, compress_image, image_data)
```

### 5.3 FastAPI Endpoint Patterns

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new review request",
    description="Creates a review request with the specified parameters.",
)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """
    Create a new review request.

    - **title**: Review request title (required)
    - **description**: Detailed description
    - **content_type**: Type of content being reviewed
    """
    try:
        review = await review_service.create(
            db=db,
            user_id=current_user.id,
            data=review_data,
        )
        logger.info(f"Review created: id={review.id}, user={current_user.id}")
        return ReviewResponse.model_validate(review)
    except ValidationError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.exception(f"Failed to create review: {e}")
        raise InternalError(message="Failed to create review")


@router.get(
    "",
    response_model=PaginatedResponse[ReviewResponse],
    summary="List reviews",
)
async def list_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    status_filter: ReviewStatus | None = Query(None, description="Filter by status"),
) -> PaginatedResponse[ReviewResponse]:
    """List reviews with pagination and optional filtering."""
    reviews, total = await review_service.list_paginated(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status_filter,
    )
    return PaginatedResponse(
        items=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        skip=skip,
        limit=limit,
    )
```

### 5.4 Pydantic Schema Patterns

```python
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from datetime import datetime
from enum import Enum

class ReviewStatus(str, Enum):
    """Review status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Base schema with common fields
class ReviewBase(BaseModel):
    """Base review schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    content_type: ContentType

# Create schema (input)
class ReviewCreate(ReviewBase):
    """Schema for creating a review."""

    @field_validator('title')
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        """Remove HTML tags and excessive whitespace."""
        import re
        v = re.sub(r'<[^>]+>', '', v)  # Remove HTML
        v = ' '.join(v.split())        # Normalize whitespace
        return v.strip()

# Response schema (output)
class ReviewResponse(ReviewBase):
    """Schema for review response."""
    id: int
    status: ReviewStatus
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode

# Update schema (partial)
class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, min_length=10, max_length=5000)

    @model_validator(mode='after')
    def check_at_least_one_field(self) -> 'ReviewUpdate':
        """Ensure at least one field is provided."""
        if not any([self.title, self.description]):
            raise ValueError('At least one field must be provided')
        return self

# Paginated response wrapper
class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: list[T]
    total: int
    skip: int
    limit: int
    has_more: bool = False

    @model_validator(mode='after')
    def compute_has_more(self) -> 'PaginatedResponse':
        self.has_more = self.skip + len(self.items) < self.total
        return self
```

### 5.5 Service Layer Pattern

```python
# services/review_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Review, User
from app.schemas import ReviewCreate, ReviewUpdate
from app.core.exceptions import NotFoundError, ForbiddenError

class ReviewService:
    """Service for review business logic."""

    async def create(
        self,
        db: AsyncSession,
        user_id: int,
        data: ReviewCreate,
    ) -> Review:
        """Create a new review."""
        review = Review(
            user_id=user_id,
            title=data.title,
            description=data.description,
            content_type=data.content_type,
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return review

    async def get_by_id(
        self,
        db: AsyncSession,
        review_id: int,
    ) -> Review:
        """Get review by ID or raise NotFoundError."""
        result = await db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()
        if not review:
            raise NotFoundError(resource="Review", resource_id=review_id)
        return review

    async def update(
        self,
        db: AsyncSession,
        review_id: int,
        user_id: int,
        data: ReviewUpdate,
    ) -> Review:
        """Update a review (owner only)."""
        review = await self.get_by_id(db, review_id)

        if review.user_id != user_id:
            raise ForbiddenError(message="Not authorized to update this review")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)

        await db.commit()
        await db.refresh(review)
        return review

    async def list_paginated(
        self,
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        status: ReviewStatus | None = None,
    ) -> tuple[list[Review], int]:
        """List reviews with pagination."""
        query = select(Review).where(Review.user_id == user_id)

        if status:
            query = query.where(Review.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Review.created_at.desc())
        result = await db.execute(query)
        reviews = list(result.scalars().all())

        return reviews, total


# Singleton instance
review_service = ReviewService()
```

---

## 6. Naming Conventions

### 6.1 Universal Rules

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase (TS) / snake_case (Python) | `userName`, `user_name` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| **Functions** | camelCase (TS) / snake_case (Python) | `fetchUser()`, `fetch_user()` |
| **Classes** | PascalCase | `UserService`, `ReviewRequest` |
| **Interfaces/Types** | PascalCase | `UserProfile`, `ReviewStatus` |
| **Enums** | PascalCase (name), UPPER_SNAKE (values) | `UserRole.ADMIN` |
| **Files (TS)** | kebab-case or camelCase | `user-service.ts`, `useAuth.ts` |
| **Files (Python)** | snake_case | `user_service.py`, `review_crud.py` |
| **Components** | PascalCase | `UserCard.tsx`, `ReviewForm.tsx` |

### 6.2 Semantic Naming

```typescript
// Booleans: is/has/can/should prefix
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === 'admin';
const shouldFetch = !cache.isValid;

// Arrays: plural nouns
const users: User[] = [];
const reviewIds: string[] = [];

// Counts: count/total prefix/suffix
const userCount = users.length;
const totalReviews = 42;

// Event handlers: handle + event
const handleClick = () => {};
const handleSubmit = () => {};
const handleUserSelect = (user: User) => {};

// Callbacks as props: on + event
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
  onUserSelect: (user: User) => void;
}

// API functions: verb + noun
async function fetchUser(id: string): Promise<User> {}
async function createReview(data: ReviewCreate): Promise<Review> {}
async function updateProfile(data: ProfileUpdate): Promise<Profile> {}
async function deleteComment(id: string): Promise<void> {}

// Hooks: use + description
function useAuth(): AuthContext {}
function useLocalStorage<T>(key: string): [T, (value: T) => void] {}
function useDebounce<T>(value: T, delay: number): T {}
```

### 6.3 Python-Specific Naming

```python
# Private methods/attributes: single underscore prefix
class UserService:
    def _validate_email(self, email: str) -> bool:
        """Internal validation helper."""
        ...

    async def _send_notification(self, user_id: int) -> None:
        """Internal notification helper."""
        ...

# "Magic" methods: double underscore
class User:
    def __init__(self, email: str):
        self.email = email

    def __str__(self) -> str:
        return f"User({self.email})"

    def __repr__(self) -> str:
        return f"User(email={self.email!r})"

# Constants at module level
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
DEFAULT_PAGE_SIZE = 20
ALLOWED_EXTENSIONS = frozenset({'jpg', 'jpeg', 'png', 'gif'})

# Type aliases
UserId = int
Email = str
JsonDict = dict[str, Any]
```

---

## 7. Error Handling

### 7.1 Frontend Error Handling

```typescript
// Custom error class for API errors
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

// Error boundary for React components
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}

// Toast notifications for user-facing errors
import { toast } from 'sonner';

async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
  }
): Promise<T | null> {
  try {
    const result = await apiCall();
    if (options?.successMessage) {
      toast.success(options.successMessage);
    }
    return result;
  } catch (error) {
    const message = error instanceof ApiClientError
      ? error.message
      : options?.errorMessage || 'An unexpected error occurred';
    toast.error(message);
    return null;
  }
}
```

### 7.2 Backend Error Handling

```python
# core/exceptions.py
from enum import Enum
from typing import Any

class ErrorCode(str, Enum):
    """Machine-readable error codes."""
    # Authentication (401)
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"

    # Authorization (403)
    FORBIDDEN = "FORBIDDEN"
    NOT_OWNER = "NOT_OWNER"

    # Resources (404)
    NOT_FOUND = "NOT_FOUND"

    # Validation (400/422)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"

    # Conflicts (409)
    ALREADY_EXISTS = "ALREADY_EXISTS"
    INVALID_STATE = "INVALID_STATE"

    # Server (500)
    INTERNAL_ERROR = "INTERNAL_ERROR"


class CritvueException(Exception):
    """Base exception for all application errors."""
    status_code: int = 500
    default_code: ErrorCode = ErrorCode.INTERNAL_ERROR
    default_message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: str | None = None,
        code: ErrorCode | None = None,
        details: dict[str, Any] | None = None,
        action: str | None = None,
    ):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.details = details
        self.action = action  # Suggested action for client
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """Convert to JSON response format."""
        response = {
            "error": {
                "code": self.code.value,
                "message": self.message,
            }
        }
        if self.details:
            response["error"]["details"] = self.details
        if self.action:
            response["error"]["action"] = self.action
        return response


# Specific exception classes
class NotFoundError(CritvueException):
    status_code = 404
    default_code = ErrorCode.NOT_FOUND

    def __init__(
        self,
        resource: str | None = None,
        resource_id: Any | None = None,
        **kwargs
    ):
        if resource:
            kwargs["message"] = kwargs.get("message", f"{resource} not found")
            if resource_id is not None:
                kwargs["details"] = {"resource": resource, "id": str(resource_id)}
        super().__init__(**kwargs)


class ValidationError(CritvueException):
    status_code = 422
    default_code = ErrorCode.VALIDATION_ERROR


class ForbiddenError(CritvueException):
    status_code = 403
    default_code = ErrorCode.FORBIDDEN


class ConflictError(CritvueException):
    status_code = 409
    default_code = ErrorCode.ALREADY_EXISTS


# Exception handlers
async def critvue_exception_handler(
    request: Request,
    exc: CritvueException
) -> JSONResponse:
    """Handle custom exceptions."""
    logger.warning(
        f"{exc.code.value}: {exc.message}",
        extra={"path": request.url.path, "method": request.method}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception(f"Unhandled exception: {exc}")

    # Don't expose internal details in production
    message = str(exc) if settings.DEBUG else "An unexpected error occurred"

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": ErrorCode.INTERNAL_ERROR.value,
                "message": message,
            }
        },
    )
```

### 7.3 Error Response Format

All API errors should follow this consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "action": "Please provide a valid email address"
  }
}
```

---

## 8. API Design

### 8.1 RESTful Conventions

```
# Resource naming (nouns, plural)
GET    /api/v1/reviews              # List reviews
POST   /api/v1/reviews              # Create review
GET    /api/v1/reviews/{id}         # Get single review
PUT    /api/v1/reviews/{id}         # Replace review
PATCH  /api/v1/reviews/{id}         # Partial update
DELETE /api/v1/reviews/{id}         # Delete review

# Sub-resources
GET    /api/v1/reviews/{id}/comments       # List review comments
POST   /api/v1/reviews/{id}/comments       # Add comment

# Actions (when REST doesn't fit)
POST   /api/v1/reviews/{id}/submit         # Submit for review
POST   /api/v1/reviews/{id}/approve        # Approve review
POST   /api/v1/reviews/{id}/reject         # Reject review

# Filtering and pagination
GET    /api/v1/reviews?status=pending&skip=0&limit=20
GET    /api/v1/reviews?created_after=2024-01-01&sort=-created_at
```

### 8.2 HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST that creates resource |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid syntax, missing required field |
| `401` | Unauthorized | No/invalid authentication |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | State conflict (duplicate, invalid transition) |
| `422` | Unprocessable | Validation error |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Error | Unexpected server error |

### 8.3 Request/Response Patterns

```typescript
// Consistent response envelope for lists
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

// Create request
interface CreateReviewRequest {
  title: string;
  description: string;
  contentType: ContentType;
}

// Update request (partial)
interface UpdateReviewRequest {
  title?: string;
  description?: string;
}

// Response includes full resource
interface ReviewResponse {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  status: ReviewStatus;
  createdAt: string;  // ISO 8601
  updatedAt: string;
  user: UserSummary;  // Nested related data
}
```

### 8.4 API Client Pattern (Frontend)

```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // Send httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.getCsrfToken(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiClientError(
        response.status,
        error.error?.code || 'UNKNOWN_ERROR',
        error.error?.message || 'An error occurred',
        error.error?.details
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

---

## 9. Database & Data Layer

### 9.1 SQLAlchemy Model Patterns

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import enum

class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class ReviewStatus(str, enum.Enum):
    """Review status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Review(Base, TimestampMixin):
    """Review request model."""
    __tablename__ = "reviews"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Data columns
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(5000), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default=ReviewStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reviews")
    slots: Mapped[list["ReviewSlot"]] = relationship(
        "ReviewSlot",
        back_populates="review",
        cascade="all, delete-orphan",
    )

    # Composite indexes for common queries
    __table_args__ = (
        Index("ix_reviews_user_status", "user_id", "status"),
        Index("ix_reviews_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"Review(id={self.id}, title={self.title!r})"
```

### 9.2 Query Patterns

```python
# DO: Use select() for queries (SQLAlchemy 2.0 style)
from sqlalchemy import select, func, and_, or_

async def get_reviews_by_user(
    db: AsyncSession,
    user_id: int,
    status: ReviewStatus | None = None,
) -> list[Review]:
    query = select(Review).where(Review.user_id == user_id)

    if status:
        query = query.where(Review.status == status.value)

    query = query.order_by(Review.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())

# DO: Use eager loading to prevent N+1 queries
from sqlalchemy.orm import selectinload, joinedload

async def get_review_with_slots(db: AsyncSession, review_id: int) -> Review | None:
    query = (
        select(Review)
        .where(Review.id == review_id)
        .options(
            selectinload(Review.slots),  # Load slots in separate query
            joinedload(Review.user),      # Load user in same query (JOIN)
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

# DO: Use bulk operations for performance
async def bulk_update_status(
    db: AsyncSession,
    review_ids: list[int],
    new_status: ReviewStatus,
) -> int:
    from sqlalchemy import update

    stmt = (
        update(Review)
        .where(Review.id.in_(review_ids))
        .values(status=new_status.value, updated_at=datetime.utcnow())
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount
```

### 9.3 Migration Best Practices

```python
# alembic/versions/xxxx_add_reviews_table.py

"""Add reviews table

Revision ID: abc123
Revises: prev123
Create Date: 2024-01-15 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'abc123'
down_revision = 'prev123'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create table with all constraints
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.String(5000), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create indexes
    op.create_index('ix_reviews_id', 'reviews', ['id'])
    op.create_index('ix_reviews_user_id', 'reviews', ['user_id'])
    op.create_index('ix_reviews_status', 'reviews', ['status'])
    op.create_index('ix_reviews_user_status', 'reviews', ['user_id', 'status'])


def downgrade() -> None:
    op.drop_index('ix_reviews_user_status', 'reviews')
    op.drop_index('ix_reviews_status', 'reviews')
    op.drop_index('ix_reviews_user_id', 'reviews')
    op.drop_index('ix_reviews_id', 'reviews')
    op.drop_table('reviews')
```

---

## 10. Security Standards

### 10.1 Authentication

```python
# DO: Use httpOnly cookies for JWT storage
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,           # Not accessible via JavaScript
        secure=settings.is_production,  # HTTPS only in production
        samesite="lax",          # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth/refresh",  # Only sent to refresh endpoint
    )

# DO: Use CSRF tokens for state-changing requests
# Double-submit cookie pattern
def verify_csrf_token(request: Request) -> bool:
    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")
    return cookie_token and header_token and cookie_token == header_token
```

### 10.2 Input Validation

```python
# DO: Validate and sanitize all inputs
from pydantic import field_validator
import re
import html

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain special character')
        return v

    @field_validator('display_name')
    @classmethod
    def sanitize_display_name(cls, v: str) -> str:
        # Remove HTML tags
        v = re.sub(r'<[^>]+>', '', v)
        # Escape remaining HTML entities
        v = html.escape(v)
        # Limit length
        return v.strip()[:100]

# DO: Validate file uploads
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError(f"Invalid file type: {file.content_type}")

    # Read first bytes to verify magic numbers
    header = file.file.read(8)
    file.file.seek(0)

    if not is_valid_image_header(header):
        raise ValidationError("File does not appear to be a valid image")
```

### 10.3 SQL Injection Prevention

```python
# DO: Use parameterized queries (SQLAlchemy handles this)
# Good
query = select(User).where(User.email == email)

# DON'T: Build raw SQL with string interpolation
# Bad - NEVER DO THIS
query = f"SELECT * FROM users WHERE email = '{email}'"

# DO: Use text() with bound parameters for raw SQL
from sqlalchemy import text
query = text("SELECT * FROM users WHERE email = :email")
result = await db.execute(query, {"email": email})
```

### 10.4 Security Headers

```python
# Middleware to add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
    )
    return response
```

### 10.5 Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(request: Request, credentials: LoginCredentials):
    ...

@router.post("/register")
@limiter.limit("3/hour")  # 3 registrations per hour
async def register(request: Request, user_data: UserCreate):
    ...
```

---

## 11. Testing Standards

### 11.1 Test File Organization

```
# Frontend
frontend/
├── __tests__/              # Unit tests
│   ├── components/         # Component tests
│   ├── hooks/              # Hook tests
│   └── lib/                # Utility tests
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts
│   ├── review-flow.spec.ts
│   └── fixtures/           # Test fixtures

# Backend
backend/tests/
├── conftest.py             # Shared fixtures
├── unit/                   # Unit tests
│   ├── test_services.py
│   └── test_utils.py
├── integration/            # Integration tests
│   ├── test_auth.py
│   └── test_reviews.py
└── e2e/                    # End-to-end tests
```

### 11.2 Python Test Patterns

```python
# conftest.py - Shared fixtures
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create isolated database session for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        yield session
        await session.rollback()

    await engine.dispose()

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("Test123!@#"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


# test_reviews.py - Integration tests
class TestReviewEndpoints:
    """Tests for review API endpoints."""

    async def test_create_review_success(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict,
    ):
        """Test successful review creation."""
        response = await client.post(
            "/api/v1/reviews",
            json={
                "title": "Test Review",
                "description": "A test review description that is long enough.",
                "content_type": "website",
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Review"
        assert data["status"] == "pending"
        assert data["user_id"] == test_user.id

    async def test_create_review_unauthorized(self, client: AsyncClient):
        """Test review creation without authentication."""
        response = await client.post(
            "/api/v1/reviews",
            json={"title": "Test", "description": "Test description"},
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "NOT_AUTHENTICATED"

    async def test_create_review_validation_error(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Test review creation with invalid data."""
        response = await client.post(
            "/api/v1/reviews",
            json={"title": "", "description": "short"},  # Invalid
            headers=auth_headers,
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"
```

### 11.3 Frontend Test Patterns

```typescript
// __tests__/hooks/useAsync.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from '@/hooks/useAsync';

describe('useAsync', () => {
  it('should handle successful async operation', async () => {
    const mockFn = jest.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useAsync(mockFn));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ data: 'test' });
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useAsync(mockFn));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeNull();
    });
  });
});


// e2e/review-flow.spec.ts - Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new review request', async ({ page }) => {
    await page.goto('/reviews/new');

    await page.fill('[name="title"]', 'My Portfolio Review');
    await page.fill('[name="description"]', 'Please review my design portfolio');
    await page.selectOption('[name="contentType"]', 'portfolio');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/reviews\/\d+/);
    await expect(page.locator('h1')).toContainText('My Portfolio Review');
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/reviews/new');

    // Submit empty form
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
  });
});
```

### 11.4 Test Best Practices

```
DO:
- Write tests for business logic and edge cases
- Use descriptive test names that explain the scenario
- Follow Arrange-Act-Assert pattern
- Use fixtures for common setup
- Test both success and error paths
- Use meaningful assertions

DON'T:
- Test implementation details (test behavior, not internals)
- Write flaky tests (avoid timeouts, use proper async handling)
- Test trivial code (getters, simple assignments)
- Couple tests to each other (each test should be independent)
- Use hardcoded magic values (use constants or fixtures)
```

---

## 12. Documentation Standards

### 12.1 Code Comments

```typescript
// DO: Explain "why", not "what"
// Bad
// Loop through users
for (const user of users) { ... }

// Good
// Process users in batches to avoid overwhelming the email service
for (const batch of chunk(users, BATCH_SIZE)) { ... }

// DO: Document complex algorithms
/**
 * Calculate reviewer match score using weighted factors:
 * - Skill overlap: 40%
 * - Availability: 30%
 * - Response time history: 20%
 * - Review quality rating: 10%
 */
function calculateMatchScore(reviewer: Reviewer, request: ReviewRequest): number {
  ...
}

// DO: Mark TODOs with context
// TODO(username): Implement caching after load testing reveals bottlenecks
// FIXME: Race condition when multiple users claim simultaneously
// HACK: Workaround for Safari flexbox bug, remove when Safari 17+ is baseline
```

### 12.2 TypeScript JSDoc

```typescript
/**
 * Fetches user profile data from the API.
 *
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration
 * @param options.includePrivate - Include private profile fields (requires admin)
 * @returns The user profile data
 * @throws {ApiClientError} When user is not found (404) or unauthorized (401)
 *
 * @example
 * ```ts
 * const profile = await fetchUserProfile('user-123');
 * console.log(profile.displayName);
 * ```
 */
async function fetchUserProfile(
  userId: string,
  options?: { includePrivate?: boolean }
): Promise<UserProfile> {
  ...
}

/**
 * Custom hook for managing modal state.
 *
 * @returns Object containing modal state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useModal();
 *
 * return (
 *   <>
 *     <Button onClick={open}>Open Modal</Button>
 *     <Modal isOpen={isOpen} onClose={close}>
 *       Content
 *     </Modal>
 *   </>
 * );
 * ```
 */
function useModal(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  ...
}
```

### 12.3 Python Docstrings (Google Style)

```python
def calculate_payout(
    review_id: int,
    base_amount: Decimal,
    platform_fee_percent: float = 0.25,
) -> PayoutResult:
    """Calculate reviewer payout after platform fee deduction.

    Uses tiered fee structure based on reviewer level. Premium reviewers
    receive reduced platform fees.

    Args:
        review_id: The ID of the completed review.
        base_amount: The total payment amount before fees.
        platform_fee_percent: Platform fee as decimal (default 25%).

    Returns:
        PayoutResult containing reviewer_amount, platform_fee, and breakdown.

    Raises:
        NotFoundError: If review_id doesn't exist.
        InvalidStateError: If review is not in COMPLETED status.

    Example:
        >>> result = calculate_payout(123, Decimal("100.00"))
        >>> print(result.reviewer_amount)
        Decimal("75.00")
    """
    ...


class ReviewService:
    """Service for managing review lifecycle.

    Handles creation, assignment, submission, and completion of reviews.
    Integrates with notification and payment services.

    Attributes:
        db: Async database session.
        notification_service: Service for sending notifications.

    Example:
        >>> service = ReviewService(db, notification_service)
        >>> review = await service.create(user_id=1, data=review_data)
    """

    async def create(
        self,
        user_id: int,
        data: ReviewCreate,
    ) -> Review:
        """Create a new review request.

        Args:
            user_id: ID of the user creating the review.
            data: Validated review creation data.

        Returns:
            The created Review model instance.

        Raises:
            ValidationError: If data validation fails.
            QuotaExceededError: If user has reached review limit.
        """
        ...
```

### 12.4 API Documentation

FastAPI auto-generates OpenAPI docs. Enhance with:

```python
@router.post(
    "/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a review request",
    description="""
    Create a new review request for creative work.

    The request will be assigned to available reviewers based on:
    - Content type matching
    - Reviewer availability
    - Skill relevance

    **Rate Limits:** 10 requests per hour per user.
    """,
    responses={
        201: {"description": "Review created successfully"},
        400: {"description": "Invalid request data"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["reviews"],
)
async def create_review(...):
    ...
```

---

## 13. Performance & Optimization

### 13.1 Frontend Performance

```typescript
// DO: Use React.lazy for code splitting
const AdminDashboard = lazy(() => import('./AdminDashboard'));

// DO: Memoize expensive components
const MemoizedList = memo(function UserList({ users }: Props) {
  return users.map(user => <UserCard key={user.id} user={user} />);
});

// DO: Use useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return [...users].sort((a, b) => b.score - a.score);
}, [users]);

// DO: Use useCallback for callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelected(id);
}, []);

// DO: Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}

// DO: Optimize images
import Image from 'next/image';

<Image
  src={user.avatarUrl}
  alt={user.displayName}
  width={64}
  height={64}
  loading="lazy"
  placeholder="blur"
  blurDataURL={PLACEHOLDER_BLUR}
/>
```

### 13.2 Backend Performance

```python
# DO: Use database connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,
)

# DO: Use eager loading to prevent N+1 queries
query = (
    select(Review)
    .options(
        selectinload(Review.slots),
        joinedload(Review.user),
    )
    .where(Review.id == review_id)
)

# DO: Use bulk operations
await db.execute(
    insert(ReviewSlot),
    [{"review_id": review.id, "status": "available"} for _ in range(count)]
)

# DO: Add database indexes for frequently queried columns
class Review(Base):
    __table_args__ = (
        Index("ix_reviews_user_status", "user_id", "status"),
        Index("ix_reviews_created_at", "created_at"),
    )

# DO: Cache frequently accessed data
from functools import lru_cache

@lru_cache(maxsize=100)
def get_tier_config(tier: str) -> TierConfig:
    return TIER_CONFIGS[tier]

# DO: Use pagination for list endpoints
@router.get("/reviews")
async def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[ReviewResponse]:
    ...

# DO: Use background tasks for non-blocking operations
from fastapi import BackgroundTasks

@router.post("/reviews")
async def create_review(
    data: ReviewCreate,
    background_tasks: BackgroundTasks,
):
    review = await review_service.create(data)
    background_tasks.add_task(send_notification, review.user_id)
    return review
```

### 13.3 Caching Strategies

```typescript
// React Query for client-side caching
const { data, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,      // Consider fresh for 5 minutes
  gcTime: 30 * 60 * 1000,        // Keep in cache for 30 minutes
  refetchOnWindowFocus: false,   // Don't refetch on tab focus
});

// Invalidate cache on mutations
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },
});
```

```python
# Server-side caching with Redis
import redis.asyncio as redis

redis_client = redis.from_url(settings.REDIS_URL)

async def get_cached_profile(user_id: int) -> dict | None:
    cached = await redis_client.get(f"profile:{user_id}")
    if cached:
        return json.loads(cached)
    return None

async def cache_profile(user_id: int, profile: dict, ttl: int = 300):
    await redis_client.set(
        f"profile:{user_id}",
        json.dumps(profile),
        ex=ttl,
    )

async def invalidate_profile_cache(user_id: int):
    await redis_client.delete(f"profile:{user_id}")
```

---

## 14. Accessibility Standards

### 14.1 Semantic HTML

```tsx
// DO: Use semantic elements
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/reviews">Reviews</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Review Request</h1>
    <section aria-labelledby="details-heading">
      <h2 id="details-heading">Details</h2>
      ...
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2024 Critvue</p>
</footer>
```

### 14.2 ARIA Attributes

```tsx
// DO: Use ARIA for dynamic content
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
  aria-haspopup="true"
>
  Menu
</button>

<div
  id="dropdown-menu"
  role="menu"
  aria-hidden={!isOpen}
>
  <button role="menuitem">Option 1</button>
  <button role="menuitem">Option 2</button>
</div>

// DO: Announce dynamic changes
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// DO: Label form inputs
<label htmlFor="email">Email address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-hint email-error"
  aria-invalid={!!error}
/>
<p id="email-hint">We'll never share your email.</p>
{error && <p id="email-error" role="alert">{error}</p>}
```

### 14.3 Keyboard Navigation

```tsx
// DO: Ensure all interactive elements are keyboard accessible
<button onClick={handleClick}>Click me</button>  // Good - naturally focusable

// DON'T: Use div for buttons
<div onClick={handleClick}>Click me</div>  // Bad - not focusable

// If you must use non-semantic element:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>

// DO: Implement focus management for modals
function Modal({ isOpen, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
```

### 14.4 Color & Contrast

```css
/* DO: Ensure sufficient color contrast (WCAG AA: 4.5:1 for text) */
:root {
  --text-primary: #1a1a1a;      /* High contrast on white */
  --text-secondary: #666666;    /* 4.5:1 contrast ratio */
  --text-muted: #737373;        /* Still meets AA for large text */
}

/* DO: Don't rely on color alone */
.error {
  color: var(--destructive);
  /* Also include icon or text indicator */
}

/* DO: Support reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. Git & Version Control

### 15.1 Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes nor adds feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance (deps, build, etc.)

**Examples:**
```
feat(reviews): add ability to request specific reviewers

fix(auth): prevent token refresh race condition

Fixes #123

refactor(api): extract common pagination logic to utility

docs(readme): update installation instructions

chore(deps): upgrade React to v19
```

### 15.2 Branch Strategy

```
main                    # Production-ready code
├── develop            # Integration branch (optional)
├── feature/xyz        # Feature branches
├── fix/issue-123      # Bug fix branches
└── release/v1.2.0     # Release preparation (optional)

# Branch naming
feature/add-reviewer-matching
feature/JIRA-123-user-auth
fix/login-redirect-loop
fix/issue-456-avatar-upload
```

### 15.3 Pull Request Guidelines

```markdown
## Summary
Brief description of changes (1-2 sentences)

## Changes
- Added reviewer matching algorithm
- Updated ReviewService with new matching logic
- Added unit tests for matching function

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if UI changes)
[Add screenshots here]

## Related Issues
Fixes #123
Related to #456
```

### 15.4 Code Review Checklist

```
For Reviewers:
- [ ] Code follows project coding standards
- [ ] Logic is correct and handles edge cases
- [ ] No security vulnerabilities introduced
- [ ] Tests cover new functionality
- [ ] No unnecessary complexity added
- [ ] Documentation updated if needed
- [ ] No hardcoded values (use constants/config)
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
```

---

## Appendix A: Quick Reference

### Import Order (TypeScript)

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal absolute imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

// 4. Relative imports
import { UserCard } from './UserCard';
import type { UserCardProps } from './types';

// 5. Styles (if not using Tailwind)
import styles from './styles.module.css';
```

### Import Order (Python)

```python
# 1. Standard library
import asyncio
import json
from datetime import datetime
from typing import Optional

# 2. Third-party packages
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

# 3. Local application imports
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.models import User, Review
from app.schemas import UserResponse
from app.services import user_service
```

### File Header Template (Python)

```python
"""
Module description.

This module provides functionality for...

Example:
    >>> from app.services import review_service
    >>> review = await review_service.create(data)
"""
```

---

## Appendix B: Tools & Linting

### Frontend Tooling

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

### Backend Tooling

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W", "UP"]

[tool.black]
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial release |

---

*This document should be reviewed and updated quarterly to incorporate new best practices and lessons learned.*
