# Avatar Components - Quick Start Guide

Get started with Critvue's avatar components in 5 minutes.

---

## Installation

All components are already installed in the Critvue codebase. No additional dependencies needed!

**Location:** `/home/user/Critvue/frontend/components/profile/`

---

## Basic Usage

### 1. Display Avatar (Read-Only)

The simplest way to show an avatar anywhere in your app:

```tsx
import { Avatar } from "@/components/profile/avatar-display";

// In your component
<Avatar
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
  size="md"
  verified={user.is_verified}
/>
```

**Size Options:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl`

---

### 2. Editable Avatar (Profile Pages)

For pages where users can change their avatar:

```tsx
import { AvatarDisplay } from "@/components/profile/avatar-display";
import { useAuth } from "@/contexts/AuthContext";

function ProfilePage() {
  const { user, updateUserAvatar } = useAuth();

  return (
    <AvatarDisplay
      avatarUrl={user.avatar_url}
      fullName={user.full_name}
      size="2xl"
      editable
      showUploadButton
      showDeleteButton
      onUploadComplete={(url) => updateUserAvatar(url)}
    />
  );
}
```

---

### 3. Upload Modal Only

If you want just the upload functionality:

```tsx
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { useAuth } from "@/contexts/AuthContext";

function UploadModal() {
  const { user, updateUserAvatar } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AvatarUpload
      currentAvatarUrl={user.avatar_url}
      onUploadComplete={(url) => {
        updateUserAvatar(url);
        setIsOpen(false);
      }}
      onUploadError={(error) => {
        console.error(error);
      }}
    />
  );
}
```

---

## Common Patterns

### Navigation Menu
```tsx
<Avatar
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
  size="md"
  verified={user.is_verified}
/>
```

### Comment/Review Author
```tsx
<div className="flex gap-3">
  <Avatar
    avatarUrl={author.avatar_url}
    fullName={author.full_name}
    size="md"
    verified={author.is_verified}
  />
  <div>
    <p className="font-semibold">{author.full_name}</p>
    <p className="text-sm text-muted-foreground">{timeAgo}</p>
  </div>
</div>
```

### Collaborator Stack
```tsx
<div className="flex -space-x-2">
  {collaborators.map((user) => (
    <Avatar
      key={user.id}
      avatarUrl={user.avatar_url}
      fullName={user.full_name}
      size="md"
      className="ring-2 ring-background"
    />
  ))}
</div>
```

### Profile Card
```tsx
<Card className="p-6">
  <div className="flex items-center gap-4">
    <Avatar
      avatarUrl={user.avatar_url}
      fullName={user.full_name}
      size="xl"
      verified={user.is_verified}
    />
    <div>
      <h3 className="font-semibold">{user.full_name}</h3>
      <p className="text-sm text-muted-foreground">{user.title}</p>
    </div>
  </div>
</Card>
```

---

## Size Guide

Choose the right size for your context:

| Size | Pixels | Use Cases |
|------|--------|-----------|
| `xs` | 24px | Notifications, small lists, inline mentions |
| `sm` | 32px | Comments, compact cards, mobile lists |
| `md` | 40px | Navigation, standard lists, chat |
| `lg` | 48px | Mobile headers, featured items |
| `xl` | 64px | Profile cards, hover cards, emphasis |
| `2xl` | 128px | Profile pages, upload preview, hero sections |

---

## AuthContext Integration

All avatar uploads automatically update the user in AuthContext:

```tsx
// 1. Import the hook
import { useAuth } from "@/contexts/AuthContext";

// 2. Get the user and update function
const { user, updateUserAvatar } = useAuth();

// 3. Call after successful upload
onUploadComplete={(url) => {
  updateUserAvatar(url);  // Updates user.avatar_url everywhere
}}
```

**What happens:**
- User object updated in React state
- User object synced to localStorage
- All components using `useAuth()` re-render with new avatar
- Navigation, profile, etc. all show new avatar instantly

---

## File Requirements

**Accepted Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**Maximum Size:** 5MB

**Recommended:**
- Square images (1:1 ratio)
- Minimum 200x200 pixels
- Clear, recognizable photo
- Professional appearance

---

## Styling Customization

All components accept a `className` prop for custom styling:

```tsx
<Avatar
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
  size="md"
  className="ring-2 ring-accent-blue"
/>
```

**Common customizations:**
- `ring-2 ring-accent-blue` - Accent ring
- `opacity-50` - Faded appearance
- `grayscale` - Black and white
- `border-4 border-white` - Thicker border

---

## Error Handling

Handle upload errors gracefully:

```tsx
const [error, setError] = useState<string | null>(null);

<AvatarUpload
  onUploadError={(errorMessage) => {
    setError(errorMessage);
    // Show toast notification
    // Log to error tracking service
  }}
/>

{error && (
  <div className="text-sm text-destructive">{error}</div>
)}
```

**Common errors:**
- File too large (> 5MB)
- Invalid file type
- Network failure
- Server error
- Authentication expired

---

## Accessibility

All components are accessible by default:

**Screen Readers:**
```tsx
// Avatar includes proper alt text automatically
<Avatar avatarUrl={url} fullName="John Doe" />
// Renders: <img alt="John Doe" ... />
```

**Keyboard Navigation:**
- Tab to focus editable avatars
- Enter to open upload modal
- Escape to close modal

**High Contrast:**
- All text meets WCAG AA standards
- Focus indicators visible
- Clear state changes

---

## Examples

### Full Integration Example

See the complete example with all features:

```tsx
import { AvatarIntegrationExample } from "@/components/profile/avatar-integration-example";

<AvatarIntegrationExample />
```

**This shows:**
- Upload and delete functionality
- Success/error messaging
- User info display
- Avatar guidelines
- Brand compliance notes
- Integration documentation

### Visual Showcase

See all avatar contexts and sizes:

```tsx
import { AvatarShowcase } from "@/components/profile/avatar-showcase";

<AvatarShowcase
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
/>
```

**Includes:**
- All size variants
- Navigation example
- Profile header
- Comments/reviews
- Reviewer cards
- Collaborator stacks
- Notifications
- Mobile navigation
- Verification status
- Fallback examples

---

## TypeScript Support

Full type safety included:

```tsx
import type { AvatarSize } from "@/components/profile/avatar-display";

const size: AvatarSize = "md"; // Autocomplete: xs, sm, md, lg, xl, 2xl
```

All props are fully typed with JSDoc comments.

---

## Performance Tips

1. **Use appropriate sizes:** Don't use `2xl` when `md` will do
2. **Lazy load:** Upload components only when needed
3. **Image optimization:** Backend should serve optimized images
4. **Memoize:** Wrap in `React.memo()` if avatar rarely changes
5. **CDN:** Serve avatars from CDN for faster loading

---

## Testing

Test your avatar implementation:

```tsx
// Unit test example
import { render } from '@testing-library/react';
import { Avatar } from '@/components/profile/avatar-display';

test('renders avatar with initials when no image', () => {
  const { getByText } = render(
    <Avatar fullName="John Doe" />
  );
  expect(getByText('JD')).toBeInTheDocument();
});
```

---

## Troubleshooting

**Avatar not showing:**
- Check `avatar_url` is valid
- Verify image is accessible
- Check network tab for 404s
- Fallback initials should still show

**Upload fails:**
- Check file size (< 5MB)
- Verify file type (JPEG, PNG, WebP, GIF)
- Check network connection
- Verify authentication

**AuthContext not updating:**
- Ensure `updateUserAvatar()` is called
- Check AuthProvider wraps your app
- Verify user is authenticated
- Check console for errors

---

## Next Steps

1. **Try the examples:**
   - Import `AvatarIntegrationExample`
   - Add to a test page
   - Experiment with props

2. **Add to your profile page:**
   - Replace existing avatar component
   - Connect to AuthContext
   - Test upload flow

3. **Update navigation:**
   - Already done in `user-menu.tsx`
   - Verify it works
   - Customize if needed

4. **Read the docs:**
   - `AVATAR_COMPONENTS_SUMMARY.md` - Complete documentation
   - `AVATAR_BRAND_COMPLIANCE.md` - Brand guidelines
   - Component files - JSDoc comments

---

## Support

**Documentation:**
- `/home/user/Critvue/AVATAR_COMPONENTS_SUMMARY.md`
- `/home/user/Critvue/AVATAR_BRAND_COMPLIANCE.md`
- `/home/user/Critvue/frontend/components/profile/`

**Examples:**
- `avatar-integration-example.tsx` - Full working example
- `avatar-showcase.tsx` - All contexts and sizes

**API:**
- `/home/user/Critvue/frontend/lib/api/profile.ts`
- `uploadAvatar(file: File)` function

---

## Summary

You now have everything you need to use Critvue's avatar system:

✓ Four production-ready components
✓ Full AuthContext integration
✓ Brand-compliant styling
✓ Accessible by default
✓ TypeScript support
✓ Comprehensive examples
✓ Complete documentation

**Get started in 3 lines:**

```tsx
import { Avatar } from "@/components/profile/avatar-display";

<Avatar avatarUrl={user.avatar_url} fullName={user.full_name} size="md" />
```

Happy coding!
