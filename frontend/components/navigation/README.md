# Critvue Navigation System

A comprehensive, brand-consistent navigation system that provides unified navigation across all pages of the Critvue application.

## Overview

The navigation system combines multiple components to create a seamless user experience across all device sizes:

- **TopNav**: Responsive header navigation (minimal on mobile, full on desktop)
- **BottomNav**: Fixed bottom navigation for mobile/tablet (existing component)
- **MobileDrawer**: Slide-in drawer for secondary navigation
- **FAB**: Floating Action Button for primary CTA (mobile only)
- **UserMenu**: Profile dropdown menu (desktop)

## Architecture

```
components/navigation/
├── navigation.tsx          # Unified wrapper component
├── top-nav.tsx            # Main header navigation
├── user-menu.tsx          # Profile dropdown menu
├── mobile-drawer.tsx      # Slide-in drawer for mobile
├── fab.tsx                # Floating action button
├── index.ts               # Export barrel
└── README.md              # This file
```

## Brand Guidelines

All components strictly follow Critvue brand guidelines:

### Colors
- **Primary**: `accent-blue` (hsl(217 91% 60%))
- **Secondary**: `accent-peach` (hsl(27 94% 54%))
- **Gradients**: `bg-gradient-to-r from-accent-blue to-accent-peach`

### Glassmorphism
- **Navigation bars**: `bg-background/80 backdrop-blur-lg`
- **Dropdowns**: `bg-background/95 backdrop-blur-xl`
- **Overlays**: `bg-black/50 backdrop-blur-sm`

### Touch Targets
- **Minimum**: 44x44px (WCAG AA)
- **Recommended**: 48-56px
- All interactive elements meet or exceed minimum requirements

## Components

### Navigation (Unified Wrapper)

**File**: `navigation.tsx`

The main component that combines all navigation elements. Automatically handles responsive behavior and auth state.

```tsx
import { Navigation } from "@/components/navigation";

<Navigation transparent={false} />
```

**Props**:
- `transparent?: boolean` - For hero sections (default: false)

### TopNav

**File**: `top-nav.tsx`

Responsive header navigation with three variants:

**Mobile (<768px)**:
```
[Logo] ........................ [Hamburger]
```

**Tablet (768-1024px)**:
```
[Logo] [Browse] [Reviews] ......... [CTA]
```

**Desktop (1024px+)**:
```
[Logo] [Browse] [Reviews] [How It Works] [Search] [Notifications] [Profile▼]
```

**Props**:
```tsx
interface TopNavProps {
  user?: User | null;
  variant?: "minimal" | "expanded" | "full" | "responsive";
  transparent?: boolean;
  onMenuClick?: () => void;
}
```

**Features**:
- Glassmorphism background with backdrop blur
- Smooth scroll shadow animation
- Active state indicators with accent-blue
- Gradient logo and CTA buttons
- Full keyboard navigation support

### UserMenu

**File**: `user-menu.tsx`

Profile dropdown menu for desktop users.

**Features**:
- Gradient avatar border
- User info display (name, email)
- Menu items: Profile, Settings, Billing, Help & Support, Sign Out
- Glassmorphism dropdown
- Click outside and Escape key to close
- Keyboard navigation support

### MobileDrawer

**File**: `mobile-drawer.tsx`

Slide-in navigation drawer for mobile/tablet.

**Features**:
- Slides in from right side
- Backdrop overlay with blur
- User profile section (if authenticated)
- Primary and secondary navigation items
- Sign out button (authenticated users)
- CTA buttons (non-authenticated users)
- Prevents body scroll when open
- Escape key to close

### FAB (Floating Action Button)

**File**: `fab.tsx`

Primary CTA button for mobile devices.

**Features**:
- Fixed position: `bottom-24 right-4` (above bottom nav)
- 56x56px size (exceeds 44px minimum)
- Gradient background: accent-blue to accent-peach
- Shadow and scale hover effects
- Optional pulse animation
- Hidden on desktop (`lg:hidden`)
- Only shown to authenticated users

**Props**:
```tsx
interface FABProps {
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  pulse?: boolean;
}
```

## Z-Index Strategy

All components follow a unified z-index system defined in `globals.css`:

```css
--z-base: 0;           /* Base content */
--z-dropdown: 10;      /* Dropdown menus */
--z-fab: 40;           /* Floating action button */
--z-sticky-nav: 50;    /* Top and bottom navigation */
--z-drawer: 100;       /* Mobile drawer overlay */
--z-modal-backdrop: 200; /* Modal backdrops */
--z-modal: 300;        /* Modals */
--z-toast: 1000;       /* Toast notifications */
```

**Applied z-index values**:
- TopNav: `z-50`
- BottomNav: `z-50`
- FAB: `z-40`
- UserMenu dropdown: `z-[60]`
- MobileDrawer overlay: `z-[100]`

## Integration

The navigation system is integrated into the root layout and appears on all pages:

**File**: `app/layout.tsx`

```tsx
import { Navigation } from "@/components/navigation";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          <main className="pt-16 md:pt-20 pb-24 lg:pb-0">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Important**: The `main` element has padding to account for fixed navigation:
- `pt-16 md:pt-20` - Top padding for TopNav
- `pb-24` - Bottom padding for BottomNav on mobile/tablet
- `lg:pb-0` - Remove bottom padding on desktop

## Responsive Behavior

### Mobile (<768px)
- TopNav: Logo + Hamburger menu
- BottomNav: 4 primary navigation items
- FAB: Visible for authenticated users
- MobileDrawer: Accessed via hamburger menu

### Tablet (768-1024px)
- TopNav: Logo + Browse + Reviews + CTA
- BottomNav: 4 primary navigation items
- FAB: Visible for authenticated users
- MobileDrawer: Accessed via hamburger menu

### Desktop (1024px+)
- TopNav: Full navigation with all items
- BottomNav: Hidden
- FAB: Hidden
- MobileDrawer: Not accessible (no hamburger menu)
- UserMenu: Profile dropdown in TopNav

## Accessibility

All components follow WCAG 2.1 Level AA standards:

### Keyboard Navigation
- **Tab**: Navigate through items
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dropdowns and drawers
- **Arrow keys**: Navigate within menus

### ARIA Attributes
```tsx
// Navigation
<nav role="navigation" aria-label="Primary navigation">

// Active items
<a aria-current="page">

// Dropdowns
<button aria-expanded={isOpen} aria-haspopup="true">

// Drawers
<div role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
```

### Color Contrast
- Normal text: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum (WCAG AA)
- All text meets or exceeds requirements

### Touch Targets
- Minimum: 44x44px
- Recommended: 48-56px
- All interactive elements meet minimum requirements

## Performance Optimizations

1. **CSS-based animations**: No JavaScript for smooth transitions
2. **Hardware acceleration**: `transform` and `opacity` only
3. **Passive scroll listeners**: `{ passive: true }`
4. **Conditional rendering**: Components only render when needed
5. **Prevent body scroll**: When drawer is open

## Testing Checklist

- [ ] Navigation visible on all pages
- [ ] Responsive behavior at breakpoints (320px, 768px, 1024px, 1440px)
- [ ] Active states reflect current page
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Dropdowns/drawer open and close correctly
- [ ] FAB visible only on mobile when authenticated
- [ ] Touch targets meet 44px minimum
- [ ] Glassmorphism effects render correctly
- [ ] Z-index layering is correct (no overlap issues)
- [ ] Smooth animations at 60fps
- [ ] No layout shift when navigation loads

## Customization

### Adding Navigation Items

**TopNav** (`top-nav.tsx`):
```tsx
const navItems: NavItem[] = [
  { label: "Browse", href: "/browse", showOn: "tablet" },
  { label: "Reviews", href: "/dashboard", showOn: "tablet" },
  { label: "How It Works", href: "/how-it-works", showOn: "desktop" },
  // Add new items here
];
```

**BottomNav** (`navigation.tsx`):
```tsx
const bottomNavItems: BottomNavItem[] = [
  { id: "home", label: "Home", icon: <Home />, onClick: () => {} },
  // Add new items here
];
```

**MobileDrawer** (`mobile-drawer.tsx`):
```tsx
const primaryNavItems: DrawerNavItem[] = [
  { label: "Home", href: "/", icon: Home, primary: true },
  // Add new items here
];
```

### Changing FAB Action

**File**: `navigation.tsx`

```tsx
<FAB
  href="/your-custom-route"
  label="Your Custom Action"
  pulse={true} // Add pulse animation
/>
```

### Transparent Navigation (Hero Sections)

```tsx
<Navigation transparent={true} />
```

The TopNav will be transparent until the user scrolls, then it will show the glassmorphism background.

## Troubleshooting

### Navigation overlaps content
- Ensure `main` has proper padding: `pt-16 md:pt-20 pb-24 lg:pb-0`

### Drawer not closing
- Check that `onClose` is properly connected
- Verify Escape key listener is working

### Active states not updating
- Ensure `usePathname()` is working correctly
- Check route matching logic in `isActive()` function

### Z-index issues
- Follow the unified z-index strategy in `globals.css`
- Avoid arbitrary z-index values

### Performance issues
- Check for unnecessary re-renders
- Ensure animations use `transform` and `opacity` only
- Verify scroll listeners are passive

## Future Enhancements

Potential improvements for future iterations:

1. **Search functionality**: Implement global search in TopNav
2. **Notifications system**: Add notification center with dropdown
3. **Dark mode toggle**: Add theme switcher in UserMenu
4. **Breadcrumbs**: Add breadcrumb navigation for deep pages
5. **Command palette**: Add keyboard shortcut (Cmd+K) for quick navigation
6. **Progress indicator**: Show loading state when navigating between pages
7. **Mobile gestures**: Add swipe-to-open drawer on mobile

## License

Part of the Critvue application. All rights reserved.
