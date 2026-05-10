# Plan: Add Login-with-Code and Forgot-Password Flows to AuthScreen

## Context

The backend already exposes four auth endpoints that have no frontend UI:
- `POST auth/code/request` / `auth/code/verify` — passwordless login via emailed 6-digit code; verify returns a JWT and signs the user in
- `POST auth/password/reset` / `auth/password/reset/confirm` — forgotten-password flow; confirm takes a code *and* a new password but does **not** sign the user in (user must log in afterwards)

The user wants both flows added to the login screen with appropriate step-by-step UX.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/services/auth.service.ts` | Add 4 new service methods |
| `src/components/AuthScreen.tsx` | Extend with new modes and UI |

---

## AuthService — New Methods

Add to `AuthService` in [src/services/auth.service.ts](src/services/auth.service.ts):

```typescript
async requestLoginCode(username: string): Promise<{ error?: string }> { ... }
// POST /auth/code/request { username }
// Returns { error? } — always succeeds from server but surfaces network errors

async verifyLoginCode(username: string, code: string): Promise<{ user: UserAuth | null; error?: string }> { ... }
// POST /auth/code/verify { username, code }
// On success: setToken(res.data.token), return { user: res.data }

async requestPasswordReset(username: string): Promise<{ error?: string }> { ... }
// POST /auth/password/reset { username }

async confirmPasswordReset(username: string, code: string, newPassword: string): Promise<{ error?: string }> { ... }
// POST /auth/password/reset/confirm { username, code, newPassword }
// On success: return {} (no token — user must sign in separately)
```

---

## AuthScreen — State & Mode Extension

Extend `AuthMode` type and add state:

```typescript
type AuthMode = 'login' | 'register' | 'code-request' | 'code-verify' | 'reset-request' | 'reset-confirm' | 'reset-done';

// New state fields alongside existing username/password/error/isLoading:
const [code, setCode] = useState('');
const [newPassword, setNewPassword] = useState('');
```

The existing `username` state is reused (carried across steps so the user doesn't re-type it).

---

## UI Flow

### Login screen (existing, minor additions)
- Keep the Sign In / Register toggle (only shown in `login` and `register` modes)
- Below the submit button, add two text links visible only in `login` mode:
  - "Forgot your password?" → sets mode to `reset-request`
  - "Sign in without a password" → sets mode to `code-request`

### Code-Request screen (`code-request`)
- Back arrow/link → `login`
- Title: "Sign In with Code"
- Email field (pre-filled with `username` if already typed)
- Button: "Send Code"
- On success → `code-verify`

### Code-Verify screen (`code-verify`)
- Back arrow/link → `code-request`
- Title: "Enter Your Code"
- Subtitle: `We sent a 6-digit code to {username}`
- Code field (text input, maxLength 6)
- Button: "Verify & Sign In"
- On success → calls `onAuthenticated(user)` (user is signed in)

### Reset-Request screen (`reset-request`)
- Back arrow/link → `login`
- Title: "Reset Password"
- Email field (pre-filled with `username`)
- Button: "Send Reset Code"
- On success → `reset-confirm`

### Reset-Confirm screen (`reset-confirm`)
- Back arrow/link → `reset-request`
- Title: "Set New Password"
- Subtitle: `We sent a 6-digit code to {username}`
- Code field (text input, maxLength 6)
- New password field (type="password")
- Button: "Reset Password"
- On success → `reset-done`

### Reset-Done screen (`reset-done`)
- Success message: "Your password has been reset. You can now sign in."
- Button: "Sign In" → sets mode to `login`, clears code/newPassword

---

## Navigation Helper

Add a `goBack()` helper or a `BACK_MAP` to keep the back-navigation logic tidy:

```typescript
const BACK_MAP: Partial<Record<AuthMode, AuthMode>> = {
  'code-request': 'login',
  'code-verify': 'code-request',
  'reset-request': 'login',
  'reset-confirm': 'reset-request',
  'reset-done': 'login',
};

function goBack() {
  const prev = BACK_MAP[mode];
  if (prev) switchMode(prev);
}
```

`switchMode` already clears the error; it will also need to clear `code` and `newPassword` when navigating backwards to avoid stale values.

---

## Verification

1. **Login with code:** Enter email on code-request screen, click Send Code, enter code on code-verify screen, click Verify — should be authenticated and see the main app.
2. **Forgot password:** Enter email on reset-request screen, click Send Reset Code, enter code + new password on reset-confirm screen, click Reset Password — should see success screen. Then click Sign In and log in with the new password.
3. **Back navigation:** Each back link/button should return to the previous step without losing the typed email.
4. **Error states:** Invalid code, wrong email, weak password should show the error Alert.
