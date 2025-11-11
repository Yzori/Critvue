# Frontend Integration Guide: Email-Only Registration

## Summary
The backend registration API now supports simplified registration with just **email + password**. The `full_name` field is now optional.

## API Changes

### Registration Endpoint: `POST /api/v1/auth/register`

**Before** (required 3 fields):
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"  // REQUIRED
}
```

**After** (requires 2 fields):
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
  // full_name is now OPTIONAL
}
```

### What Happens When full_name is Not Provided?

The backend automatically generates a display name from the email prefix:

| Email | Auto-Generated full_name |
|-------|---------------------------|
| `john.doe@example.com` | `john.doe` |
| `jane@company.com` | `jane` |
| `user+tag@example.com` | `user+tag` |
| `john.smith@example.com` | `john.smith` |

### API Response

The response **always includes full_name** (either provided or auto-generated):

```json
{
  "id": 1,
  "email": "jane.smith@example.com",
  "full_name": "jane.smith",  // Auto-generated
  "role": "creator",
  "is_active": true,
  "is_verified": false,
  "bio": null,
  "avatar_url": null,
  "created_at": "2025-11-11T10:00:00.000Z"
}
```

## Frontend Implementation Options

### Option 1: Remove full_name Field Entirely (Recommended)
Simplest approach for minimal friction:

```typescript
// Registration form with just email and password
interface RegistrationData {
  email: string;
  password: string;
  // full_name removed
}

const register = async (data: RegistrationData) => {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    const user = await response.json();
    // user.full_name will be auto-generated (e.g., "jane.smith")
    console.log(`Welcome, ${user.full_name}!`);
  }
};
```

### Option 2: Make full_name Optional
Give users the choice to provide a name:

```typescript
interface RegistrationData {
  email: string;
  password: string;
  full_name?: string;  // Optional
}

// In your form JSX:
<input
  type="text"
  name="full_name"
  placeholder="Full Name (optional)"
  // Not required
/>
```

### Option 3: Keep full_name But Don't Require It
Maintain the field but mark it as optional in the UI:

```tsx
<FormField
  label="Full Name (Optional)"
  name="full_name"
  placeholder="e.g., John Doe"
  required={false}
/>
```

## Backward Compatibility

✓ **No breaking changes**
- Existing registration calls that include `full_name` will continue to work
- You can update your frontend gradually
- Both approaches work simultaneously

## Validation Rules

### Email
- Must be valid email format
- Must be unique (will get 400 error if email already exists)

### Password
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

### Full Name (when provided)
- Maximum 255 characters
- HTML tags automatically stripped
- Whitespace automatically trimmed

## Example Registration Flows

### Minimal Registration (Recommended)
```typescript
// 1. User enters only email and password
const registerData = {
  email: "john.doe@example.com",
  password: "SecurePass123!"
};

// 2. Call API
const response = await registerUser(registerData);

// 3. Response includes auto-generated name
console.log(response.full_name); // "john.doe"

// 4. User can edit their name later in profile settings
```

### With Optional Name
```typescript
// 1. User can optionally provide full name
const registerData = {
  email: "john.doe@example.com",
  password: "SecurePass123!",
  full_name: "John Doe"  // User provided
};

// 2. Response uses provided name
console.log(response.full_name); // "John Doe"
```

## UI/UX Recommendations

1. **Minimal Form** (Best for conversions)
   - Show only Email and Password fields
   - Use auto-generated name throughout the app
   - Allow users to update their name in profile settings later

2. **Progressive Profile**
   - Register with email/password only
   - After registration, prompt user to "Complete Your Profile"
   - Let them add/edit their full name, bio, avatar, etc.

3. **Display Name Usage**
   - Use `full_name` for displaying user's name in UI
   - For auto-generated names like "john.doe", consider:
     - Displaying as-is: "Welcome, john.doe!"
     - Capitalizing: "Welcome, John.doe!"
     - Using first part: "Welcome, John!"

## Error Handling

```typescript
try {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 400:
        // Email already exists
        console.error(error.detail);
        break;
      case 422:
        // Validation error (weak password, invalid email)
        console.error(error.detail);
        break;
      default:
        console.error('Registration failed');
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Migration Steps

1. **Update TypeScript Interfaces**
   ```typescript
   // Before
   interface RegisterRequest {
     email: string;
     password: string;
     full_name: string;  // required
   }

   // After
   interface RegisterRequest {
     email: string;
     password: string;
     full_name?: string;  // optional
   }
   ```

2. **Update Form Validation**
   ```typescript
   // Remove required validation from full_name field
   const schema = yup.object({
     email: yup.string().email().required(),
     password: yup.string().min(8).required(),
     full_name: yup.string().optional()  // Changed from required()
   });
   ```

3. **Update UI**
   - Remove asterisk (*) from full_name label
   - Add "(optional)" text to label
   - Or remove the field entirely

4. **Test Both Flows**
   - Test registration WITH full_name
   - Test registration WITHOUT full_name
   - Verify auto-generated names display correctly

## Testing Checklist

- [ ] Register with email + password only
- [ ] Verify auto-generated full_name in response
- [ ] Register with email + password + full_name
- [ ] Verify provided full_name is used
- [ ] Login with email-only registered account
- [ ] View profile (/me endpoint) shows correct full_name
- [ ] Auto-generated names display properly in UI
- [ ] Error messages work correctly
- [ ] Backward compatibility with existing accounts

## Questions or Issues?

The backend changes are complete and deployed. The registration endpoint accepts requests with or without `full_name`. Update your frontend at your convenience - both approaches work!
